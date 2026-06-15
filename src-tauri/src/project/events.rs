use serde::Serialize;
use tauri::State;

use super::event_scan::analyze;
use super::{DataModelNode, ProjectStore};

const SOURCEMAP_FILE: &str = "sourcemap.json";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Signal {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub fired_by: Vec<String>,
    pub connected_by: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnresolvedEvent {
    pub from: String,
    pub expr: String,
    pub action: String,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct EventGraph {
    pub signals: Vec<Signal>,
    pub unresolved: Vec<UnresolvedEvent>,
}

#[tauri::command]
pub fn project_events(store: State<'_, ProjectStore>) -> Option<EventGraph> {
    let root = store.0.lock().unwrap().as_ref().map(|m| m.root.clone())?;
    let text = std::fs::read_to_string(root.join(SOURCEMAP_FILE)).ok()?;
    let tree: DataModelNode = serde_json::from_str(&text).ok()?;
    Some(analyze(&root, &tree))
}
