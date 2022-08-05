use std::process;
use changelog_generator::{parse, config};

fn main() {
    parse::run();
    unsafe {
        process::exit(crate::config::EXIT_CODE)
    }
}
