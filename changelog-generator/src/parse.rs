use std::{
    env,
    fs::OpenOptions,
    io::{Read, Seek, SeekFrom, Write},
    os::unix::process::CommandExt,
    path::Path,
    process,
    str::from_utf8,
    vec,
};

use crate::config::{self, Config};
use indexmap::IndexMap;
use regex;

#[allow(dead_code)]

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

pub fn get_branch_name(config: &Config) -> String {
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
    branch_name.replace("\n", "")
}

// 'config' Config
// 'n' number of commits
pub fn parse_git_log(config: &Config, n: usize) -> Vec<String> {
    //git log
    let mut git_log = process::Command::new("git");
    // check if
    if let Some(r_path) = &config.repo_path {
        git_log.arg("-C").arg(r_path);
    };
    git_log.arg("log");

    git_log.arg("-n");
    git_log.arg(n.to_string());

    git_log.arg("--oneline");

    let git_log_output = git_log.output().expect("Failed git log call");
    let git_log_str = from_utf8(&git_log_output.stdout).unwrap();

    assert!(!git_log_str.is_empty(), "Git log empty! Make sure the script is ran from the base repo directory or check repository path arg correctness");

    let spl = git_log_str.split("\n");
    let commit_data: Vec<String> = spl.map(|s| s.into()).collect();

    commit_data
}

// 'config' Config
// 'release_range' a range of 2 versions ex. v3.2.0 , v3.2.1
pub fn parse_git_log_range(config: &Config, release_range: (&str, &str)) -> Vec<String> {
    //git log
    let mut git_log = process::Command::new("git");
    // check if
    if let Some(r_path) = &config.repo_path {
        git_log.arg("-C").arg(r_path);
    };
    git_log.arg("log");

    //add in log range if previous release was found
    if !release_range.1.trim().is_empty() {
        git_log.arg(format!("{}..{}", release_range.0, release_range.1));
    } else {
        git_log.arg(format!("{}..", release_range.0));
    }

    git_log.arg("--oneline");

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

// checksout master, collects commits ids then checks back to the original branch
// changing nothing
// Used to collect commit IDs to compare if a commit in the release
// branch is contained in the master branch
// 'to_commit' collect from start to to_commit range, (to_commit, "") as git log is reverse order
pub fn collect_master_commit_ids(config: &Config, to_commit: &str) -> Vec<String> {
    //get branch name to reverse checkout changes
    let r_branch = get_branch_name(config);
    // master checkout
    let mut git_checkout = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        git_checkout.arg("-C").arg(r_path);
    };
    git_checkout.arg("checkout");
    git_checkout.arg("manta");

    git_checkout
        .output()
        .expect("Failed manta master branch checkout");

    // fetch origin
    let mut git_fetch = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        git_fetch.arg("-C").arg(r_path);
    };
    git_fetch.arg("fetch");
    git_fetch.arg("origin");

    git_checkout
        .output()
        .expect("Failed manta master branch checkout");

    let mut master_commits = parse_git_log_range(config, (to_commit, ""));
    //remove last string as its going to be empty
    master_commits.pop();
    //reverse order so commits are in proper chronological order
    master_commits.reverse();
    let mut master_commit_ids: Vec<String> = vec![];
    for master_commit_str in master_commits.iter() {
        master_commit_ids.push(
            master_commit_str
                .split_whitespace()
                .next()
                .expect("Could not read commit_id from master git log!")
                .to_string(),
        )
    }
    let mut git_checkout_back = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        git_checkout_back.arg("-C").arg(r_path);
    };
    git_checkout_back.arg("checkout");
    git_checkout_back.arg(r_branch);

    git_checkout_back
        .output()
        .expect("Failed manta master branch checkout back command");

    master_commit_ids
}

// parse the git log and collect the commit data based on it with github API calls
// `input` is a vector of every line from gitlog
// 'login_info' is the login info of the caller (username:pass/authtoken) needed to make
// calls to the API without getting timed out or limited in the number of calls per hour
pub fn parse_commits(input: Vec<String>, login_info: (&str, &str), config: &Config) -> Vec<Commit> {
    let mut commits: Vec<Commit> = vec![];

    // get master commit relative to this release commits
    let end_commit_id = input[0]
        .split_whitespace()
        .next()
        .expect("Could not get start commit");
    let master_commit_ids = collect_master_commit_ids(config, end_commit_id);

    let pr_id_pattern = regex::Regex::new(r"(#[0-9]+)").expect("Invalid regex");

    for commit_str in input.iter() {
        let mut splitter = commit_str.split_whitespace();

        // need it for its length
        let commit_id = splitter.next().unwrap();

        let pr_id_str = splitter.last().unwrap();

        let mut pr_id = String::new();
        let mut commit_title = String::new();
        // if pr_id_pattern does not match we know there is no PR ID,
        // those cases are when someone merges without a pull request
        // we can search for a "Merge pull request #XYZ" style commit
        if !pr_id_pattern.is_match(pr_id_str) {
            // Merge without PR (bad case)
            commit_title = commit_str[commit_id.len() + 1..].to_string();
            let merge_pr_pattern =
                regex::Regex::new(r"merge pull request #[0-9]+").expect("Invalid merge regex");

            if let Some(m) = merge_pr_pattern.find(&commit_title.to_lowercase()) {
                pr_id = commit_title["merge pull request #".len()..m.end()].to_string();
            } else {
                if master_commit_ids.contains(&commit_id.to_string()) {
                    println!("ERROR: Commit with no relation to Pull request found in Release Branch AND in Master Manta \
                    (no PR ID and is not \"Merge pull request style\".\n\
                    Commit: {}\n\
                    Master branch should not contain commits without PRS or the given format to relate to a PR!\n\
                    ##########################################", commit_str);
                    unsafe {
                        crate::config::EXIT_CODE = 1;
                    }
                } else {
                    println!("WARNING: Commit with no relation to Pull request found in Release Branch (no PR ID and is not \"Merge pull request style\".\n\
                    Commit: {}\n\
                    If this was not intended please review\n\
                    ##########################################", commit_str);
                }
                continue;
            }
        } else {
            // Normal case PRs
            // need only the number itself (#xyz)
            pr_id = pr_id_str[2..pr_id_str.len() - 1].to_string();

            commit_title =
                commit_str[commit_id.len() + 1..(commit_str.len() - pr_id_str.len())].to_string();
        }

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

        //check if pr_ID is real ID or not, normal pull requests dont have message as the API will be successful
        if let Some(_) = json_data.get("message") {
            continue;
        } else {
            // This case is a rare exception, more of a fool proof
            // In the case someone has merged without a pull request and the commit name ends with (#XYZ)
            // as we don't have any other way of checking
            // using contains instead of normal comparing because of github tags in merges like [manta]
            // in the commit title that appear in the API but not the local git log
            let pr_title = json_data["title"]
                .as_str()
                .expect("could not read PR title from API")
                .to_string();
            if pr_title.contains(commit_title.trim()) {
                // preferably take API PR title as it is more consistent
                commit_title = pr_title;
            } else {
                continue;
            }
        }

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
            commit_title,
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
) -> IndexMap<String, Vec<String>> {
    let mut changelog_data: IndexMap<String, Vec<String>> = IndexMap::new();

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
        //init table to keep order of config labels
        for (_, label_str) in &config.labels {
            if !changelog_data.contains_key(label_str) {
                changelog_data.insert(label_str.clone(), Vec::new());
            }
        }
        //fill changelog data with prs
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

    // find previous version in changelog use ## and /n to make it more concrete to not mess up if there is
    // a version string somewhere in the commit messages
    let version_pattern = regex::Regex::new(&format!("## {}\n", &config.version_pattern))
        .expect("Failed constructing changelog version regex");
    let prev_version_range = match version_pattern.find(&changelog_contents) {
        Some(m) => (m.start() + 3..m.end() - 1),
        None => (0..0),
    };

    // accommodate +3 to remove the hashtags and -1 at the end to remove the new line
    let prev_version = &changelog_contents[prev_version_range.start..prev_version_range.end];
    // find current version from branch name

    // get current version and the branch name
    let branch_name = get_branch_name(&config);
    let version_loc = regex::Regex::new(&config.version_pattern)
        .expect("Failed constructing changelog version regex")
        .find(&branch_name)
        .expect(
            "Could not locate version, check your branch name if it fits the release convention",
        );

    let current_version = branch_name[version_loc.range()].to_string();

    // compensate +3 offset back for the "## " string at the start of the version line
    let mut changelog_contents_offset = prev_version_range.start - 3;
    let mut release_range = (prev_version, "");

    if prev_version == current_version {
        // find the second version found in the changelog to know where to overwrite
        let pp_version_range = version_pattern
            .find_at(&changelog_contents, prev_version_range.end)
            .expect("Failed finding previous changelog block while overwriting previous block")
            .range();

        // accommodate +3 to remove the hashtags
        let pp_version = &changelog_contents[pp_version_range.start + 3..pp_version_range.end - 1];
        // use branch name as its more consistent and can work without tags too while its easier to filter tags with workflows
        release_range = (pp_version, &branch_name);

        changelog_contents_offset = pp_version_range.start;
    }

    let mut commit_data = parse_git_log_range(&config, release_range);
    //remove last string as its going to be empty
    commit_data.pop();
    //reverse order so commits are in proper chronological order
    commit_data.reverse();
    let changelog_data = prepare_changelog_strings(
        parse_commits(commit_data, config.auth_pair, &config),
        &config,
    );

    let mut new_changelog_block = format!("# CHANGELOG \n\n## {}\n", current_version);

    for (label, prs) in changelog_data {
        //write label name
        if prs.is_empty() {
            continue;
        }
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
