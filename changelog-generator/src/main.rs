use changelog_generator::{config, parse};
use std::process;

fn main() {
    env_logger::builder()
    .format_timestamp(None)
    .init();
    parse::run();
    unsafe { process::exit(crate::config::EXIT_CODE) }
}
