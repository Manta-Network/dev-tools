# A tool to generate a changelog for a release using the old changelog as a basis

## Rules and Recommendations 
:warning: **Commits that will get added to the changelog**:
#### Normal commits from pull request merge

#### "Merge pull request #XYZ.." style commits, the changelog generator
#### will search for the #XYZ pull request and add that to the changelog

#### Do NOT put things like [MANTA]/[dolphin] and etc, let that be handled by the config either in
####  prefix/suffix labels as A-manta : MA the resulting prefix/suffix will be [MA] and so on [MACADO]

### Recommendation: Keep your pull request titles short,concise and well writen

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
cargo run -- -u @github_username @github_password/authtoken
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


### Sample Config.toml
```toml
repo_path = "/home/simeonzahariev/work/Manta"
version_pattern = "v[0-9]+.[0-9]+.[0-9]+"

[labels]
L-add = "Added"
L-changed = "Changed"
L-deprecated = "Deprecated"
L-removed = "Removed"
L-fixed = "Fixed"
L-security = "Security"

[suffix_labels]
A-manta = "MA"
A-calamari = "CA"
A-dolphin = "DO"

[prefix_labels]

```
