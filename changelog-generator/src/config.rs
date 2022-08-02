use std::{collections::HashMap, fs::OpenOptions, io::Read, path::Path};

pub type LabelMap = HashMap<String, String>;

// Holds data from the cli args passed
// 'repo_path' path to the repo if you are calling the script outside of the local repo.
// if None is given, we assume the script is called from within the repo
// 'auth_pair' is a pair with login info (username, password/authtoken) used to authenticate to github API
// 'labels' is the changelog labels
// 'prefix labels' are specific suffix labels
pub struct Config<'a> {
    pub repo_path: Option<String>,
    pub auth_pair: (&'a str, &'a str),
    pub labels: LabelMap,
    pub prefix_labels: LabelMap,
    pub suffix_labels: LabelMap,
    pub version_pattern: String,
}

impl<'a> Config<'a> {
    pub fn new(args: &'a Vec<String>) -> Self {
        let mut cli_repo_path = "";
        let mut auth_pair = ("", "");
        let mut config_path = "./config.json";

        for idx in 1..args.len() {
            match args[idx].as_str() {
                "--config" | "-c" => {
                    assert!(
                        idx + 1 < args.len(),
                        "Invalid Config Arguments ( --config/-c followed by the config path"
                    );
                    if Path::new(&args[idx + 1]).exists() {
                        config_path = args[idx + 1].as_str();
                    } else {
                        println!(
                            "{}",
                            "Using default config location as the path given does not exist"
                        );
                    }
                }
                "--user" | "-u" => {
                    assert!(
                        idx + 2 < args.len(),
                        "Invalid Config Arguments ( --config/-c followed by the config path"
                    );
                    auth_pair = (args[idx + 1].as_str(), args[idx + 2].as_str())
                }
                "--repo" | "-r" => {
                    assert!(
                        idx + 1 < args.len(),
                        "Invalid Repo Arguments ( --repo/-r followed by the config path"
                    );
                    assert!(
                        Path::new(&args[idx + 1]).exists(),
                        "Repo Path does not exist"
                    );
                    cli_repo_path = args[idx + 1].as_str();
                }
                _ => {}
            }
        }
        assert!(!(auth_pair.0.is_empty() || auth_pair.1.is_empty()), "Please provide authentication info: -u/--user followed \
                                                                        by your username then your password/authtoken");

        Self::create_from_path(cli_repo_path, auth_pair, config_path)
    }

    // creates a Config from a config file path collecting the labels
    fn create_from_path(
        cli_repo_path: &'a str,
        auth_pair: (&'a str, &'a str),
        config_path: &str,
    ) -> Self {
        let mut config_handle = OpenOptions::new()
            .read(true)
            .open(config_path)
            .expect(&format!("Failed to open {}", &config_path));

        let mut config_contents = String::new();
        config_handle
            .read_to_string(&mut config_contents)
            .expect("Failed reading config contents");

        let json_data: serde_json::Value =
            serde_json::from_str(&config_contents).expect("Failed converting config to json");

        // If no repo path is given by the arguments, we try to take from config.
        // If no repo path is found we assume the script is being called from the repo itself
        let mut repo_path: Option<String> = None;
        if !cli_repo_path.is_empty() {
            repo_path = Some(cli_repo_path.to_string());
        } else {
            if let Some(p) = json_data["repo_path"].as_str() {
                repo_path = Some(p.to_string());
            }
        }

        let mut new_config = Config {
            repo_path: repo_path,
            auth_pair,
            labels: LabelMap::new(),
            prefix_labels: LabelMap::new(),
            suffix_labels: LabelMap::new(),
            version_pattern: String::new(),
        };

        // fill everything from the config file
        Self::labels_fill(&mut new_config.labels, &json_data["labels"]);
        Self::labels_fill(&mut new_config.suffix_labels, &json_data["suffix_labels"]);
        Self::labels_fill(&mut new_config.prefix_labels, &json_data["prefix_labels"]);
        new_config.version_pattern = json_data["version_pattern"]
            .as_str()
            .unwrap_or("")
            .to_string();

        new_config
    }

    // NOTE: unfortunately we cannot use deserialize as json is unordered format and we want to maintain the order of labels.
    // Some crate with indexmap or BTree may be able to keep it ordered but there are other headaches there
    fn labels_fill(labelmap: &mut LabelMap, json_label_data: &serde_json::Value) {
        for (k, v) in json_label_data.as_object().unwrap() {
            labelmap.insert(
                k.to_owned(),
                v.as_str()
                    .expect("Failed converting value to string")
                    .to_string(),
            );
        }
    }
}
