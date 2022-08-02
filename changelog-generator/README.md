# A tool to generate a changelog for a release using the old changelog as a basis

## Build
```shell
git clone git@github.com:Manta-Network/dev-tools.git
cd changelog-generator
cargo b -r
```

## Running
:warning: **If your local branch is not the release-vX.Y.Z**:
 - Clone manta and make/checkout the release branch.
 - This should be rarely needed as probably the same person who handles the release branch will be generating
```shell
cargo run -- -z -u @github_username @github_password/authtoken
```

## Mandatory Args
``` -u/--user ``` followed by your github username and password/auth_token

## Optional Args (either CLI/Config or using their default)

### -Config Path
CLI:
``` -c/--config ``` : config path;
Default: 
```./config```
### -Repository Path
CLI:
``` -r/--repo ``` followed by the path
Config File:
```repo-path:``` followed by the path as a string
Default:
  Only if calling the script from the repo directory


### Sample Config.json
```
{
    "repo_path" : "/home/simeonzahariev/work/Manta",
    "labels": {
        "L-add": "Added",
        "L-changed": "Changed",
        "L-deprecated": "Deprecated",
        "L-removed": "Removed",
        "L-fixed": "Fixed",
        "L-security": "Security"
    },
    "suffix_labels": {
        "A-manta": "MA",
        "A-calamari": "CA",
        "A-dolphin": "DO"
    },
    "prefix_labels":{},
    "version_pattern": "v[0-9].[0-9].[0-9]"
}
```
