use std::{fs::OpenOptions, io::Read, path::Path, process};

pub type LabelMap = indexmap::IndexMap<String, String>;

pub static mut EXIT_CODE: i32 = 0;

const CLI_HELP_STR: &str = "#####################################
Changelog Generator Help\n
### Mandatory Arguments:
--user/-u : @yourgithub_username @github_password/authtoken
\n### Optional Arguments(Can be customised from the config file):\n
--config/-c Path to config.json
--repo/-r Path to repo if not calling from the repo\n
--help/-h Prints Help and does not execute script
#######################################\n";

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
        if args.len() < 2 {
            println!("{}", CLI_HELP_STR);
            process::exit(1);
        }

        let mut cli_repo_path = "";
        let mut auth_pair = ("", "");
        let mut config_path = "./config.toml";

        let mut arg_it = args[1..].iter().peekable();
        while let Some(arg) = arg_it.next() {
            match arg.as_str() {
                "--config" | "-c" => {
                    assert!(
                        !arg_it.peek().is_none(),
                        "Invalid Config Arguments ( --config/-c followed by the config path to config.toml )"
                    );

                    if Path::new(&arg_it.peek().unwrap()).exists() {
                        config_path = arg_it.next().unwrap().as_str();
                    } else {
                        println!(
                            "{}",
                            "Using default config location as the path given does not exist"
                        );
                        //consume this as we want to skip it
                        arg_it.nth(0);
                    }
                }
                "--user" | "-u" => {
                    assert!(
                        !arg_it.peek().is_none(),
                        "Invalid Authentication info ( --user/-u followed by your github username then your password/authtoken"
                    );
                    let auth_name = arg_it.next().unwrap();
                    assert!(
                        !arg_it.peek().is_none(),
                        "Invalid Authentication info ( --user/-u followed by your github username then your password/authtoken"
                    );
                    let auth_pass = arg_it.next().unwrap();
                    auth_pair = (auth_name, auth_pass);
                }
                "--repo" | "-r" => {
                    assert!(
                        !arg_it.peek().is_none(),
                        "Invalid Repo Arguments ( --repo/-r followed by the config path"
                    );
                    assert!(
                        Path::new(&arg_it.peek().unwrap()).exists(),
                        "Repo Path does not exist"
                    );
                    cli_repo_path = arg_it.next().unwrap().as_str();
                }
                "--help" | "-h" => {
                    println!("\n{}", CLI_HELP_STR);
                    process::exit(127);
                }
                other => {
                    println!("Invalid Arguments: {:?}\n{}", other, CLI_HELP_STR);
                    process::exit(127);
                }
            }
        }
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

        let config_data: toml::Value =
            toml::from_str(&config_contents).expect("Failed converting config to str");

        // If no repo path is given by the arguments, we try to take from config.
        // If no repo path is found we assume the script is being called from the repo itself
        let mut repo_path: Option<String> = None;
        if !cli_repo_path.is_empty() {
            repo_path = Some(cli_repo_path.to_string());
        } else {
            if let Some(p) = config_data.get("repo_path") {
                repo_path = Some(
                    p.as_str()
                        .expect("could not read repo_path from config file")
                        .to_string(),
                );
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
        Self::labels_fill(&mut new_config.labels, &config_data["labels"]);
        Self::labels_fill(&mut new_config.suffix_labels, &config_data["suffix_labels"]);
        Self::labels_fill(&mut new_config.prefix_labels, &config_data["prefix_labels"]);
        new_config.version_pattern = config_data["version_pattern"]
            .as_str()
            .unwrap_or("")
            .to_string();

        new_config
    }

    // NOTE: unfortunately we cannot use deserialize as json is unordered format and we want to maintain the order of labels.
    // Some crate with indexmap or BTree may be able to keep it ordered but there are other headaches there
    fn labels_fill(labelmap: &mut LabelMap, config_label_data: &toml::Value) {
        for (k, v) in config_label_data
            .as_table()
            .expect("could not convert toml data to table")
        {
            labelmap.insert(
                k.to_owned(),
                v.as_str()
                    .expect("Failed converting value to string")
                    .to_string(),
            );
        }
    }
}
