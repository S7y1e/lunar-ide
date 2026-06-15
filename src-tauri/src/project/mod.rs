use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

pub mod dependencies;
pub mod events;
mod event_ctx;
mod event_scan;
mod lex_util;
mod luau_lex;

const DEFAULT_PROJECT_FILE: &str = "default.project.json";
const SOURCEMAP_FILE: &str = "sourcemap.json";
const MANIFEST_FILE: &str = "lunar.toml";

#[derive(Debug, Clone, Default, Deserialize)]
pub struct Manifest {
    #[serde(default)]
    pub sync: SyncManifest,
    #[serde(default)]
    pub sourcemap: SourcemapManifest,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct SyncManifest {
    pub backend: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct SourcemapManifest {
    pub project: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RojoProjectFile {
    name: String,
}

#[derive(Debug, Clone)]
pub struct ProjectModel {
    root: PathBuf,
    name: String,
    project_file: String,
    manifest: Manifest,
}

impl ProjectModel {
    fn load(root: &Path) -> Self {
        let manifest = std::fs::read_to_string(root.join(MANIFEST_FILE))
            .ok()
            .and_then(|text| toml::from_str::<Manifest>(&text).ok())
            .unwrap_or_default();

        let project_file = manifest
            .sourcemap
            .project
            .clone()
            .unwrap_or_else(|| DEFAULT_PROJECT_FILE.to_string());

        let name = std::fs::read_to_string(root.join(&project_file))
            .ok()
            .and_then(|text| serde_json::from_str::<RojoProjectFile>(&text).ok())
            .map(|project| project.name)
            .unwrap_or_else(|| folder_name(root));

        ProjectModel {
            root: root.to_path_buf(),
            name,
            project_file,
            manifest,
        }
    }

    fn snapshot(&self) -> ProjectSnapshot {
        ProjectSnapshot {
            root: self.root.to_string_lossy().into_owned(),
            name: self.name.clone(),
            project_file: self.project_file.clone(),
            sync_backend: self.sync_backend(),
        }
    }

    fn sync_backend(&self) -> Option<String> {
        self.manifest.sync.backend.clone().or_else(|| {
            self.root
                .join("argon.toml")
                .exists()
                .then(|| "argon".to_string())
        })
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSnapshot {
    pub root: String,
    pub name: String,
    pub project_file: String,
    pub sync_backend: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataModelNode {
    pub name: String,
    pub class_name: String,
    #[serde(default)]
    pub file_paths: Vec<String>,
    #[serde(default)]
    pub children: Vec<DataModelNode>,
}

#[derive(Default)]
pub struct ProjectStore(Mutex<Option<ProjectModel>>);

#[tauri::command]
pub fn project_open(
    app: AppHandle,
    store: State<'_, ProjectStore>,
    root: String,
) -> ProjectSnapshot {
    let model = ProjectModel::load(Path::new(&root));
    let snapshot = model.snapshot();
    *store.0.lock().unwrap() = Some(model);
    let _ = app.emit("project://opened", snapshot.clone());
    snapshot
}

#[tauri::command]
pub fn project_close(app: AppHandle, store: State<'_, ProjectStore>) {
    *store.0.lock().unwrap() = None;
    let _ = app.emit("project://closed", ());
}

#[tauri::command]
pub fn project_snapshot(store: State<'_, ProjectStore>) -> Option<ProjectSnapshot> {
    store.0.lock().unwrap().as_ref().map(ProjectModel::snapshot)
}

#[tauri::command]
pub fn project_data_model(store: State<'_, ProjectStore>) -> Option<DataModelNode> {
    let root = store.0.lock().unwrap().as_ref().map(|model| model.root.clone())?;
    let text = std::fs::read_to_string(root.join(SOURCEMAP_FILE)).ok()?;
    serde_json::from_str(&text).ok()
}

fn folder_name(root: &Path) -> String {
    root.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| "project".to_string())
}
