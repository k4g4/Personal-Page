use serde::{Deserialize, Serialize};

#[derive(Clone, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Bar {
    First,
    Second(u32),
    Third { thing: String },
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Foo {
    pub bars: Vec<Bar>,
    pub hello: bool,
}
