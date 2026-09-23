import { TicketType } from '../types';

export interface TicketOptionItem {
  id: string;
  title: string;
  text: string;
}

export type TicketOption = TicketOptionItem;

export interface TicketCategoryConfig {
  type: TicketType;
  code: string;
  label: string;
  shortLabel: string;
  fullTitle: string;
  badgeColor: string;
  description: string;
  options: TicketOptionItem[];
}

export const TICKET_CATEGORIES: Record<TicketType, TicketCategoryConfig> = {
  TS: {
    type: 'TS',
    code: 'TS',
    label: 'Ticket de Soporte (TS)',
    shortLabel: 'TS',
    fullTitle: 'Ticket de Soporte',
    badgeColor: 'bg-amber-400 text-neutral-950 border-amber-300',
    description: 'Dudas, preguntas en general o reporte de fallos en la aplicación.',
    options: [
      {
        id: 'ts-ayuda',
        title: 'Necesito ayuda',
        text: 'Dudas y preguntas en general'
      },
      {
        id: 'ts-aplicacion',
        title: 'Aplicación',
        text: 'Reporte de fallos en la aplicación'
      },
      {
        id: 'ts-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  },
  TRU: {
    type: 'TRU',
    code: 'TRU',
    label: 'Reporte de Usuario (TRU)',
    shortLabel: 'TRU',
    fullTitle: 'Reporte de Usuario',
    badgeColor: 'bg-rose-500 text-white border-rose-400',
    description: 'Reportar infracciones, perfiles fraudulentos o faltas de respeto de un usuario.',
    options: [
      {
        id: 'tru-inapropiado',
        title: 'Contenido Inapropiado o Sensible',
        text: 'Imágenes, textos o comportamientos contrarios a las normas comunitarias.'
      },
      {
        id: 'tru-estafa',
        title: 'Estafa, Fraude o Engaño',
        text: 'Ofertas dudosas.'
      },
      {
        id: 'tru-acoso',
        title: 'Acoso u Ofensas',
        text: 'Insultos, discriminación, burlas o amenazas.'
      },
      {
        id: 'tru-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  },
  TRP: {
    type: 'TRP',
    code: 'TRP',
    label: 'Reporte de Publicación (TRP)',
    shortLabel: 'TRP',
    fullTitle: 'Reporte de Publicación',
    badgeColor: 'bg-red-500 text-white border-red-400',
    description: 'Reportar una publicación o foto que vulnere las normas comunitarias.',
    options: [
      {
        id: 'trp-inapropiado',
        title: 'Contenido Inapropiado o Sensible',
        text: 'Imágenes, textos o comportamientos contrarios a las normas'
      },
      {
        id: 'trp-estafa',
        title: 'Estafa, Fraude o Engaño',
        text: 'Ofertas dudosas.'
      },
      {
        id: 'trp-acoso',
        title: 'Acoso u Ofensas',
        text: 'Insultos, discriminación, burlas o amenazas'
      },
      {
        id: 'trp-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  },
  TRH: {
    type: 'TRH',
    code: 'TRH',
    label: 'Reporte de Historia (TRH)',
    shortLabel: 'TRH',
    fullTitle: 'Reporte de Historia',
    badgeColor: 'bg-orange-500 text-white border-orange-400',
    description: 'Reportar una historia temporal contraria a las normas de convivencia.',
    options: [
      {
        id: 'trh-inapropiado',
        title: 'Contenido Inapropiado o Sensible',
        text: 'Imágenes, textos o comportamientos contrarios a las normas'
      },
      {
        id: 'trh-estafa',
        title: 'Estafa, Fraude o Engaño',
        text: 'Ofertas dudosas.'
      },
      {
        id: 'trh-acoso',
        title: 'Acoso u Ofensas',
        text: 'Insultos, discriminación, burlas o amenazas'
      },
      {
        id: 'trh-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  },
  TRM: {
    type: 'TRM',
    code: 'TRM',
    label: 'Reporte de Mensaje (TRM)',
    shortLabel: 'TRM',
    fullTitle: 'Reporte de Mensaje',
    badgeColor: 'bg-pink-500 text-white border-pink-400',
    description: 'Reportar un mensaje indebido enviado en chats o mensajes privados.',
    options: [
      {
        id: 'trm-inapropiado',
        title: 'Contenido Inapropiado o Sensible',
        text: 'Imágenes, textos o comportamientos contrarios a las normas'
      },
      {
        id: 'trm-estafa',
        title: 'Estafa, Fraude o Engaño',
        text: 'Ofertas dudosas.'
      },
      {
        id: 'trm-acoso',
        title: 'Acoso u Ofensas',
        text: 'Insultos, discriminación, burlas o amenazas'
      },
      {
        id: 'trm-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  },
  TRG: {
    type: 'TRG',
    code: 'TRG',
    label: 'Reporte de Grupo (TRG)',
    shortLabel: 'TRG',
    fullTitle: 'Reporte de Grupo',
    badgeColor: 'bg-purple-500 text-white border-purple-400',
    description: 'Reportar un grupo que vulnere las reglas o promueva actividades ilícitas.',
    options: [
      {
        id: 'trg-inapropiado',
        title: 'Contenido Inapropiado o Sensible',
        text: 'Imágenes, textos o comportamientos contrarios a las normas'
      },
      {
        id: 'trg-estafa',
        title: 'Estafa, Fraude o Engaño',
        text: 'Ofertas dudosas.'
      },
      {
        id: 'trg-acoso',
        title: 'Acoso u Ofensas',
        text: 'Insultos, discriminación, burlas o amenazas'
      },
      {
        id: 'trg-otro',
        title: 'Otro Motivo',
        text: 'Cualquier otra vulneración a la convivencia.'
      }
    ]
  }
};
