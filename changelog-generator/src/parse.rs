use std::{env, fs, path::Path, process, str::from_utf8, vec};

use crate::config::Config;
use crate::git_util::*;
use indexmap::IndexMap;
use regex;

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

// Used to collect commit IDs to compare if a commit in the release
// branch is contained in the master branch
// 'to_commit' collect from start to to_commit range, (to_commit, "") as git log is reverse order
pub fn collect_master_commit_ids(config: &Config, to_commit: &str) -> Vec<String> {
    //git log
    let mut git_fetch = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        git_fetch.arg("-C").arg(r_path);
    };
    git_fetch.arg("fetch");
    git_fetch.arg("origin");
    git_fetch.output().expect("Failed git fetch origin call");

    let mut git_log = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        git_log.arg("-C").arg(r_path);
    };
    git_log.arg("log");

    git_log.arg(format!("{}..origin/manta", to_commit));

    git_log.arg("--oneline");

    log::info!("collect_master_commit_ids Issuing git command {:?}", git_log);
    let git_log_output = git_log.output().expect("Failed git log call");
    let git_log_str = from_utf8(&git_log_output.stdout).unwrap();
    // NOTE: log being empty is not an error here if `to_commit` is manta HEAD
    // TODO: Check explicitly that to_commit SHA is identical to `origin/manta`
    if git_log_str.is_empty(){
        log::warn!("collect_master_commit_ids git log empty!");
        return vec![];
    }
    let spl = git_log_str.split("\n");
    let mut commit_data: Vec<String> = spl.map(|s| s.into()).collect();
    //remove last string as its going to be empty
    commit_data.pop();
    //reverse order so commits are in proper chronological order
    commit_data.reverse();
    let mut master_commit_ids: Vec<String> = vec![];
    for master_commit_str in commit_data.iter() {
        master_commit_ids.push(
            master_commit_str
                .split_whitespace()
                .next()
                .expect("Could not read commit_id from master git log!")
                .to_string(),
        )
    }

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

        let pr_id : String;
        let pr_title : String;
        // if pr_id_pattern does not match we know there is no PR ID,
        // those cases are when someone merges without a pull request
        // we can search for a "Merge pull request #XYZ" style commit
        if !pr_id_pattern.is_match(pr_id_str) {
            // Merge without PR (bad case)
            let commit_msg = commit_str[commit_id.len() + 1..].to_string();
            let merge_pr_pattern =
                regex::Regex::new(r"merge pull request #[0-9]+").expect("Invalid merge regex");

            if let Some(m) = merge_pr_pattern.find(&commit_msg.to_lowercase()) {
                pr_id = commit_msg["merge pull request #".len()..m.end()].to_string();
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
            pr_title = json_data["title"]
                .as_str()
                .expect("could not read PR title from API")
                .to_string();
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
            pr_title,
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
                    suffix = format!(" [{}]", suffix);
                }
                let commit_str = format!(
                    r"- [\#{}]({}) {}{}",
                    commit.pr_id,
                    commit.relative_pr_url,
                    commit.merged_pr_title.trim(),
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

    let changelog_contents =
        fs::read_to_string(&changelog_path).expect("Failed reading changelog contents");

    // find previous version in changelog use ## and /n to make it more concrete to not mess up if there is
    // a version string somewhere in the commit messages
    let version_pattern = regex::Regex::new(&format!("## {}\n", &config.version_pattern))
        .expect("Failed constructing changelog version regex");
    let prev_version_range = match version_pattern.find(&changelog_contents) {
        Some(m) => m.start() + 3..m.end() - 1,
        None => 0..0,
    };

    // accommodate +3 to remove the hashtags and -1 at the end to remove the new line
    let prev_version = &changelog_contents[prev_version_range.start..prev_version_range.end];
    // find current version from branch name

    // get current version and the branch name
    let mut branch_name = get_branch_name(&config);
    // branch name may be empty on tag checkout because of the detached HEAD so we need to describe the tag
    if branch_name.is_empty() {
        branch_name = get_tag_name(&config);
    }
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
    log::info!("Running on release range {:?}", release_range);

    let mut commit_data = parse_git_log_range(&config, release_range);
    //remove last string as its going to be empty
    log::debug!("Got {:?}", commit_data);
    commit_data.pop();
    //reverse order so commits are in proper chronological order
    commit_data.reverse();
    let changelog_data = prepare_changelog_strings(
        parse_commits(commit_data, config.auth_pair, &config),
        &config,
    );

    let mut new_changelog_block = format!("# CHANGELOG\n\n## {}\n", current_version);

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
    fs::write(&changelog_path, new_changelog_block).expect("Failed writing new changelog");
}
