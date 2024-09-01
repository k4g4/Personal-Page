use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Bar {
    First,
    Second(u32),
    Third { thing: String },
}

#[derive(Serialize)]
pub struct Foo {
    pub bars: Vec<Bar>,
    pub hello: bool,
}
