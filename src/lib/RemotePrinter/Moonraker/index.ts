/**
 * Moonraker Class file
 *
 * This file holds abstractions for printers to access and control Moonraker.
 */

import type RemotePrinter from '$lib/RemotePrinter/RemotePrinter';
import { type UpdateCheckResult } from '$lib/RemotePrinter/RemotePrinter';
import {
  type APIResult,
  type MachineUpdateStatusAPIResponse,
  type UpdateRepositoryStatus,
  isUpdateRepositoryStatus,
  isSystemUpdateStatus
} from './RemoteAPI';

import WS from 'ws';

export default class MoonrakerRemotePrinter implements RemotePrinter {
  public connectionType: 'moonraker' | 'octoprint' | 'none' = 'moonraker';
  /**
   * Connection Address
   * This address is the URL used to connect to Moonraker.
   * It should have a scheme, hostname, and an optional port.
   * @example http://mainsail.local
   */
  public connectionAddress: string;
  public connectionAPIKey?: string;

  /**
   * Websocket Connection
   * NULL when not connected or otherwise not available
   */
  protected socket: WS | null = null;

  /**
   *
   * @param address {string} The URL to connect to the Moonraker instance
   * @param apiKey {string} The API key to connect to the Moonraker instance
   * @see MoonrakerConnection.connectionAddress
   */
  constructor(address: string, apiKey?: string) {
    this.connectionAddress = address;
    if (apiKey !== undefined) this.connectionAPIKey = apiKey;
  }

  protected buildConnectionURL(websocket = false): string {
    let url = this.connectionAddress;
    // If WebSocket, chage the http(s) to ws(s)
    if (websocket) {
      url = url.replace('http', 'ws');
    }
    // Strip away trailing slash, if any
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
  }

  public async openSocketConnection(): Promise<WS | false> {
    const socket = new WS(`${this.buildConnectionURL(true)}/websocket`);
    this.socket = socket;
    return socket;
  }

  /**
   * Tests the connection to Moonraker
   * @returns {Promise<boolean>} boolean indicating if Moonraker is connected
   */
  public async testConnection(): Promise<boolean> {
    const url = this.buildConnectionURL();
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (error) {
      return false;
    }
    return false;
  }
  /**
   * Emergency Stop
   * Turns off heaters, de-energizes motors, and stops the printer.
   * Fans will jump to 100% if configured in Klipper.
   */
  public emergencyStop(): void {
    fetch(`${this.buildConnectionURL()}/printer/emergency_stop`, { method: 'POST' });
  }
  /**
   * Restart
   * Restarts the printer, if possible.
   */
  public restart(): void {
    fetch(`${this.buildConnectionURL()}/printer/restart`, { method: 'POST' });
  }
  /**
   * Firware Restart
   * Restarts the printer, if possible, using the FIRMWARE_RESTART command.
   */
  public firmwareRestart(): void {
    fetch(`${this.buildConnectionURL()}/printer/firmware_restart`, { method: 'POST' });
  }

  public checkForUpdates(refresh?: boolean | undefined) {
    return fetch(`${this.buildConnectionURL()}/machine/update / status ? refresh = ${refresh}`, {
      method: 'POST'
    })
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((updateStatus: APIResult<MachineUpdateStatusAPIResponse>) => {
        const versionInfo = updateStatus.result.version_info;
        // get the keys of the versionInfo object as modules
        const modules = Object.keys(
          versionInfo
        ) as (keyof MachineUpdateStatusAPIResponse['version_info'])[];
        // Build an array of objects, one object per module
        const moduleInfo = modules
          .map((module) => {
            if (versionInfo[module] !== undefined) {
              const moduleVersion = versionInfo[module];
              if (moduleVersion === undefined) return null;
              if (isUpdateRepositoryStatus(moduleVersion)) {
                return {
                  local: moduleVersion.version,
                  remote: moduleVersion.remote_version,
                  commits_behind: moduleVersion.commits_behind.length
                };
              } else if (isSystemUpdateStatus(moduleVersion)) {
                return {
                  packages: moduleVersion.package_list
                };
              } else {
                // Type is Boolean
                return null;
              }
            } else {
              return null;
            }
          })
          .filter((module) => module !== null);
        return moduleInfo;
      })
      .catch((err) => {
        return null;
      }) as unknown as Promise<UpdateCheckResult | null>;
  }

  /**
   * Subscribe to temperature data
   */
  // public subscribeTemperature(): void {
  //   this.socket.send()
  // }

  // fetchExtruders();
  // fetchHeaters();
  // fetchMotors();
  // fetchFans();

  // fetchTemperatureData();

  // fetchPosition();
  // fetchStatus();

  // public async queryVolume(): Promise<MoonrakerAPIResult.XYZEarray|null> {

  // }
}
