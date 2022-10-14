use crate::config::Config;
use std::{process, str::from_utf8};
// 'commit_msg' Message/Title of the pull request itself
// 'pr_id' Pull Request ID
// 'labels' an array of all the labels in the pull request
// 'relative_pr_url' url of the pull request, used to make the links in the changelog
pub struct Commit {
    pub merged_pr_title: String,
    pub pr_id: String, // keeping it as string as anyway will be used only in string formatting
    pub labels: Vec<String>,
    pub relative_pr_url: String,
}

impl Commit {
    pub fn new(
        merged_pr_title: String,
        pr_id: String,
        labels: Vec<String>,
        relative_pr_url: String,
    ) -> Self {
        Self {
            merged_pr_title,
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

pub fn get_tag_name(config: &Config) -> String {
    let mut tag_call = process::Command::new("git");
    if let Some(r_path) = &config.repo_path {
        tag_call.arg("-C").arg(r_path);
    };

    tag_call.arg("describe").arg("--tag");

    let branch_call_output = tag_call.output().expect("Failed git branch --show-current");

    let tag_name = from_utf8(&branch_call_output.stdout)
        .expect("Failed to read branch name")
        .to_string();
    tag_name.replace("\n", "")
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
