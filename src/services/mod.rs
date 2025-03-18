// This module will contain the service abstractions for interacting with Triton components
// These services will be responsible for making HTTP requests to the Triton APIs

mod vmapi;
mod cnapi;
mod imgapi;
mod napi;
mod ufds;
mod amon;
mod jobs;
mod papi;

pub use vmapi::VmapiService;
pub use cnapi::CnapiService;
pub use imgapi::ImgapiService;
pub use napi::NapiService;
pub use ufds::UfdsService;
pub use amon::AmonService;
pub use jobs::JobsService;
pub use papi::PapiService;