//通信类型
declare interface IWindowControl {
   minimize: () => void;
   maximize: () => void;
   close: () => void;
   openDevTools: () => void;
}
declare interface IElectronApi {
   WindowControl: IWindowControl;
}
