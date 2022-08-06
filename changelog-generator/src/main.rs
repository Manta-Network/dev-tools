use changelog_generator::{config, parse};
use std::process;

fn main() {
    parse::run();
    unsafe { process::exit(crate::config::EXIT_CODE) }
}
