//通信类型
declare interface IWindowControl {
   minimize: () => void;
   maximize: () => void;
   close: () => void;
   openDevTools: () => void;
}

declare interface BrowserControl {
   openBrowser: (url: string) => void;
}

declare interface EmccExecuteResult {
   success: boolean;
   stdout?: string;
   stderr?: string;
   error?: string;
}

declare interface EmccControl {
   executeCommand: (command: string, workDir?: string) => Promise<EmccExecuteResult>;
   selectFile: () => Promise<{ filePath: string; fileName: string } | null>;
}

declare interface InternalElectron {
   showVersionInfo: () => void;
   checkUpdate: () => void;
}

declare interface IElectronApi {
   WindowControl: IWindowControl;
   BrowserControl: BrowserControl;
   EmccControl: EmccControl;
   //electron内部
   InternalControl: InternalElectron;
}
