/// Indica cómo está instalada la app, para decidir si puede actualizarse sola.
/// - "windows" / "macos" / "appimage": el actualizador integrado puede reemplazar la app con un clic.
/// - "linux-rpm" / "linux-deb": instalada en /usr/bin con el gestor de paquetes (requiere permisos
///   de sistema), por lo que solo se muestra el aviso con el botón de descarga del paquete correcto.
#[tauri::command]
fn install_kind() -> &'static str {
  if cfg!(target_os = "windows") {
    "windows"
  } else if cfg!(target_os = "macos") {
    "macos"
  } else if std::env::var_os("APPIMAGE").is_some() {
    "appimage"
  } else {
    let os_release = std::fs::read_to_string("/etc/os-release")
      .unwrap_or_default()
      .to_lowercase();
    let rpm_family = ["fedora", "rhel", "centos", "suse", "opensuse", "mageia"];
    if os_release
      .lines()
      .filter(|l| l.starts_with("id=") || l.starts_with("id_like="))
      .any(|l| rpm_family.iter().any(|d| l.contains(d)))
    {
      "linux-rpm"
    } else {
      "linux-deb"
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![install_kind])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
