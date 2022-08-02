use std::{
    collections::HashMap,
    env,
    fs::OpenOptions,
    io::{Read, Seek, SeekFrom, Write},
    path::Path,
    process,
    str::from_utf8,
    vec,
};

use crate::config::Config;
use regex;

// 'commit_msg' Message/Title of the pull request itself
// 'pr_id' Pull Request ID
// 'labels' an array of all the labels in the pull request
// 'relative_pr_url' url of the pull request, used to make the links in the changelog
pub struct Commit {
    commit_msg: String,
    pr_id: String, // keeping it as string as anyway will be used only in string formatting
    pub labels: Vec<String>,
    relative_pr_url: String,
}

impl Commit {
    pub fn new(
        commit_msg: String,
        pr_id: String,
        labels: Vec<String>,
        relative_pr_url: String,
    ) -> Self {
        Self {
            commit_msg,
            pr_id,
            labels,
            relative_pr_url,
        }
    }
}

pub fn get_release_version(config: &Config, pattern: &regex::Regex) -> String {
    let mut branch_call = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        branch_call.arg("-C").arg(r_path);
    };

    branch_call.arg("branch").arg("--show-current");

    let branch_call_output = branch_call
        .output()
        .expect("Failed git branch --show-current");
    let branch_name = from_utf8(&branch_call_output.stdout)
        .expect("Failed to read branch name")
        .to_string();

    let version_loc = pattern.find(&branch_name).expect(
        "Could not locate version, check your branch name if it fits the release convention",
    );

    branch_name[version_loc.range()].to_string()
}

// 'config' Config
// 'release_range' a range of 2 versions ex. v3.2.0 , v3.2.1
pub fn parse_git_log(config: &Config, release_range: (&str, &str)) -> Vec<String> {
    //git log
    let mut git_log = process::Command::new("git");
    // check if
    if let Some(r_path) = &config.repo_path {
        git_log.arg("-C").arg(r_path);
    };
    git_log.arg("log");

    //add in log range if previous release was found
    if !release_range.0.trim().is_empty() {
        git_log.arg(format!("{}..{}", release_range.0, release_range.1));
    }

    git_log
        .arg(format!("{}..", release_range.0))
        .arg("--oneline");

    let git_log_output = git_log.output().expect("Failed git log call");
    let git_log_str = from_utf8(&git_log_output.stdout).unwrap();

    assert!(!git_log_str.is_empty(), "Git log empty! Make sure the script is ran from the base repo directory or check repository path arg correctness");

    let spl = git_log_str.split("\n");
    let commit_data: Vec<String> = spl.map(|s| s.into()).collect();

    commit_data
}

pub fn make_changelog_path(config: &Config) -> String {
    let changelog_path = match &config.repo_path {
        Some(path) => format!("{}/{}", path, "CHANGELOG.md"),
        None => "CHANGELOG.md".to_string(),
    };

    assert!(
        Path::new(&changelog_path).exists(),
        "Could not locate CHANGELOG.md! \
                                                Make sure script is ran from repo directory \
                                                or check repository path correctness"
    );
    changelog_path
}

// parse the git log and collect the commit data based on it with github API calls
// `input` is a vector of every line from gitlog
// 'login_info' is the login info of the caller (username:pass/authtoken) needed to make
// calls to the API without getting timed out or limited in the number of calls per hour
pub fn parse_commits(input: Vec<String>, login_info: (&str, &str)) -> Vec<Commit> {
    let mut commits: Vec<Commit> = vec![];
    let pr_id_pattern = regex::Regex::new(r"(#[0-9]+)").expect("Invalid regex");
    for commit_str in input.iter() {
        let mut splitter = commit_str.split_whitespace();

        // need it for its length
        let commit_id = splitter.next().unwrap();

        let pr_id_str = splitter.last().unwrap();

        // skip pull requests that have no Pull Request ID
        if !pr_id_pattern.is_match(pr_id_str) {
            continue;
        }
        // need only the number itself (#xyz)
        let pr_id = pr_id_str[2..pr_id_str.len() - 1].to_string();

        let commit_msg =
            commit_str[commit_id.len() + 1..(commit_str.len() - pr_id_str.len())].to_string();

        let response = process::Command::new("curl")
            .arg(format!(
                "https://api.github.com/repos/Manta-Network/Manta/pulls/{}",
                pr_id
            ))
            .arg("-u")
            .arg(format!("{}:{}", login_info.0, login_info.1))
            .output()
            .expect("github api request failed");

        //convert to json for easier parsing
        let json_data: serde_json::Value =
            serde_json::from_str(from_utf8(&response.stdout).expect("to utf8 failed"))
                .expect("Failed converting raw data to json");
        let pull_request_url = json_data["html_url"]
            .as_str()
            .expect("Failed reading PR, make sure -u arguments are correct")
            .to_string();

        //collecting all the labels (future proof so as to not hardcode specific labels)
        let labels = json_data["labels"]
            .as_array()
            .expect("Failed parsing labels from json");
        let mut cur_commit_labels: Vec<String> = vec![];
        for label_data in labels {
            cur_commit_labels.push(
                label_data["name"]
                    .as_str()
                    .expect("Failed parsing label name from data")
                    .to_string(),
            );
        }

        commits.push(Commit::new(
            commit_msg,
            pr_id,
            cur_commit_labels,
            pull_request_url,
        ))
    }
    commits
}

// create hashmap in which the key is the label string aka for L-Added it would be Added as defined in the config
// and the values are the PR strings that will be written under the label
// 'commits' is a vector of 'Commit' which have been parsed from the git log
pub fn prepare_changelog_strings(
    commits: Vec<Commit>,
    config: &Config,
) -> HashMap<String, Vec<String>> {
    let mut changelog_data: HashMap<String, Vec<String>> = HashMap::new();

    for commit in commits {
        //prefix for dolphin/calamari/manta etc
        let mut suffix = String::new();

        for suffix_label in commit.labels.iter() {
            match config.suffix_labels.get(suffix_label) {
                Some(v) => {
                    suffix.push_str(v);
                }
                None => {}
            };
        }
        for label in commit.labels.iter() {
            if let Some(label_str) = config.labels.get(label) {
                if !suffix.is_empty() {
                    suffix = format!("[{}]", suffix);
                }
                let commit_str = format!(
                    r"-[\#{}]({}) {} {}",
                    commit.pr_id,
                    commit.relative_pr_url,
                    commit.commit_msg.trim(),
                    suffix
                );

                if !changelog_data.contains_key(label_str) {
                    changelog_data.insert(label_str.clone(), Vec::new());
                }
                changelog_data.get_mut(label_str).unwrap().push(commit_str);
            }
        }
    }
    changelog_data
}

pub fn run() {
    let args: Vec<String> = env::args().collect();
    let config = Config::new(&args);
    let changelog_path = make_changelog_path(&config);

    //load changelog and collect information from it for the git log
    let mut changelog_handle = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(&changelog_path)
        .expect(&format!("Failed to open {}", &changelog_path));

    let mut changelog_contents = String::new();
    changelog_handle
        .read_to_string(&mut changelog_contents)
        .expect("Failed reading changelog contents");

    // find previous version in changelog
    let version_pattern = regex::Regex::new(&format!("## {}",&config.version_pattern))
        .expect("Failed constructing changelog version regex");
    let prev_version_range = match version_pattern.find(&changelog_contents) {
        Some(m) => m.range(),
        None => (0..0),
    };
    // accommodate +3 to remove the hashtags
    let prev_version = &changelog_contents[prev_version_range.start + 3 ..prev_version_range.end];
    // find current version from branch name
    let current_version = get_release_version(&config, &regex::Regex::new(&config.version_pattern).expect("Failed constructing changelog version regex"));
    
    let mut changelog_contents_offset = prev_version_range.start;
    let mut release_range = (prev_version, "");
    
    if prev_version == current_version {
        // find the second version found in the changelog to know where to overwrite
        let pp_version_range = version_pattern
            .find_at(&changelog_contents, prev_version_range.end)
            .expect("Failed finding previous changelog block while overwriting previous block").range();

        // accommodate +3 to remove the hashtags
        let pp_version = &changelog_contents[pp_version_range.start + 3 .. pp_version_range.end];
        release_range = (pp_version, prev_version);

        changelog_contents_offset = pp_version_range.start; // -3 to accommodate "## "
    }

    let mut commit_data = parse_git_log(&config, release_range);
    //remove last string as its going to be empty
    commit_data.pop();
    //reverse order so commits are in proper chronological order
    commit_data.reverse();
    let changelog_data =
        prepare_changelog_strings(parse_commits(commit_data, config.auth_pair), &config);

    let mut new_changelog_block = format!("# CHANGELOG \n\n## {}\n", current_version);

    for (label, prs) in changelog_data {
        //write label name
        new_changelog_block.push_str(&format!("### {}\n", label));
        for pr in prs {
            new_changelog_block.push_str(&format!("{}\n", pr));
        }
        new_changelog_block.push_str("\n");
    }
    //remove last trailing new line
    //new_changelog_block = new_changelog_block[..new_changelog_block.len()].to_string();
    // add in previous changelog data
    new_changelog_block.push_str(&changelog_contents[changelog_contents_offset..]);

    // go back to start of file and overwrite
    // using overwriting over whole contents as that will let us
    // rewrite previous releases too if they get yanked(aka re-release)
    changelog_handle.seek(SeekFrom::Start(0)).unwrap();
    changelog_handle
        .write_all(new_changelog_block.as_bytes())
        .expect("Failed writing new changelog");
}
