
export interface Evento {
    id:string
    name: string;
    organization: string;
    startDate: string;
    location: string;
    locationImage: string;
    isStart: boolean,
    isFinalized: boolean,
    lutas:[Lutador, Lutador][];
    url:string;
    portal:Portal
  }
  
  export interface Portal {
    name:string,
    isActive: boolean,
    isFinalized: boolean,
    priceEntrada:number,
    metaQTDEntrada:number,
    
    lutasFotos:[string, string][]
    media:{
        videMP4:string,
        
    }
}