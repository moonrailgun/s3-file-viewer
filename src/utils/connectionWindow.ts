import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { notifications } from '@mantine/notifications';

/**
 * Open connection form window for creating a new connection
 */
export function openConnectionForm() {
  const win = new WebviewWindow('connection-form', {
    url: '/src/windows/connection-form.html',
    title: 'New Connection',
    width: 450,
    height: 560,
    center: true,
    resizable: false,
    decorations: true,
  });

  win.once('tauri://error', (e) => {
    console.error('Connection form window error:', e);
    notifications.show({
      message: `Cannot open connection window: ${e.payload}`,
      color: 'red',
      position: 'bottom-right',
    });
  });
}

/**
 * Open connection form window for editing an existing connection
 */
export function openEditConnectionForm(connectionId: string) {
  const win = new WebviewWindow(`connection-form-${Date.now()}`, {
    url: `/src/windows/connection-form.html?connectionId=${connectionId}`,
    title: 'Edit Connection',
    width: 450,
    height: 560,
    center: true,
    resizable: false,
    decorations: true,
  });

  win.once('tauri://error', (e) => {
    console.error('Connection form window error:', e);
    notifications.show({
      message: `Cannot open connection window: ${e.payload}`,
      color: 'red',
      position: 'bottom-right',
    });
  });
}
