use std::net::TcpStream;
use std::path::Path;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};

// Must match ADMIN_PORT in admin/.env (default 4317) and the remote URL in capabilities/default.json
const ADMIN_ADDR: &str = "127.0.0.1:4317";
const ADMIN_URL: &str = "http://127.0.0.1:4317";

struct ServerProcess(Mutex<Option<Child>>);

fn server_running() -> bool {
    TcpStream::connect_timeout(&ADMIN_ADDR.parse().unwrap(), Duration::from_millis(200)).is_ok()
}

// The admin server is admin/server.mjs in this repo checkout, next to the .env holding the key,
// so the key is never compiled into the app.
fn start_server() -> std::io::Result<Child> {
    let admin_dir = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();

    #[cfg(unix)]
    {
        // apps launched from Finder/a dock don't get your shell's PATH (nvm, Homebrew), so go through a login shell
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".into());
        Command::new(shell)
            .args(["-lc", "exec node server.mjs"])
            .current_dir(admin_dir)
            .spawn()
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        Command::new("node")
            .arg("server.mjs")
            .current_dir(admin_dir)
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            // under `tauri dev` (or with `npm start` already running) the server is up already
            if !server_running() {
                let child = start_server()?;
                *app.state::<ServerProcess>().0.lock().unwrap() = Some(child);
                let deadline = Instant::now() + Duration::from_secs(15);
                while !server_running() {
                    if Instant::now() > deadline {
                        return Err("The admin server didn't start. Is Node installed, and does admin/ have node_modules?".into());
                    }
                    std::thread::sleep(Duration::from_millis(150));
                }
            }

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(ADMIN_URL.parse().unwrap()))
                .title("Blog Admin")
                .inner_size(1280.0, 840.0)
                .min_inner_size(820.0, 520.0)
                .build()?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app, event| {
        if let RunEvent::Exit = event {
            if let Some(mut child) = app.state::<ServerProcess>().0.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
    });
}
