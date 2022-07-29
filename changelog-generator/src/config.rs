use std::path::Path;

// contains const
// probably will move this to a config file so its easier to edit

// prefix for [Dolphin] and etc
// A pair of the label and the String that you want to be used in the Changelog
pub static PREFIX_LABELS: &'static [(&str,&str)] = &[
    ("A-calamari", "Calamari"),
    ("A-dolphin", "Dolphin"),
];

// Sections that the changelog will be separated on
// A pair of the label and the String that you want to be used in the Changelog
pub static SECTION_LABELS: &'static [(&str,&str)] = &[
    ("L-added", "Added"),
    ("L-changed", "Changed"),
    ("L-deprecated", "Deprecated"),
    ("L-removed", "Removed"),
    ("L-fixed", "Fixed"),
    ("L-security", "Security"),
];

// get custom label text aka L-added will return Added
// if nothing found None
// TODO: maybe move to config and load labels as hashmaps for easier use
pub fn get_label_str(s_label: &str, labels: &[(&str,&str)]) -> Option<String> {
    for label_tup in labels{
        if label_tup.0.contains(s_label){
            return Some(label_tup.1.to_string())
        }
    }   
    None
}

// Holds data from the cli args passed
// 'repo_path' path to the repo if you are calling the script outside of the local repo
// 'auth_pair' is a pair with login info (username, password/authtoken) used to authenticate to github API
// 'config_path' if a custom config is used
pub struct Config<'a> {
    pub repo_path: Option<&'a str>,
    pub auth_pair: (&'a str, &'a str),
    pub config_path: Option<&'a str>,
}

impl<'a> Config<'a>{
    pub fn new(args: &'a Vec<String>) -> Self {
        let mut repo_path = None;
        let mut auth_pair = ("", "");
        let mut config_path = None;
        for idx in 1..args.len() {
            match args[idx].as_str() {
                "--config" | "-c" => {
                    assert!(idx+1 < args.len(), "Invalid Config Arguments ( --config/-c followed by the config path");
                    assert!(Path::new(&args[idx+1]).exists(), "Config Path does not exist");
                    config_path = Some(args[idx+1].as_str());
                } ,
                "--user" | "-u" => {
                    assert!(idx+2 < args.len(), "Invalid Config Arguments ( --config/-c followed by the config path");
                    auth_pair = (args[idx+1].as_str(), args[idx+2].as_str())
                },
                "--repo" | "-r" => {
                    assert!(idx+1 < args.len(), "Invalid Repo Arguments ( --repo/-r followed by the config path");
                    assert!(Path::new(&args[idx+1]).exists(), "Repo Path does not exist");
                    repo_path = Some(args[idx+1].as_str());
                },
                _=>{},
            }
        }
        assert!(!(auth_pair.0.is_empty() || auth_pair.1.is_empty()), "Please provide authentication info: -u/--user followed \
                                                                        by your username then your password/authtoken");
                                                                        
        Config{repo_path, auth_pair, config_path}
    }
}
