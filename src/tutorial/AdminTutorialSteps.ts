// adminTutorialSteps.ts
export type TooltipPlacement = "top" | "bottom" | "left" | "right" | "right-bottom";

export interface TutorialStep {
  id: number;
  route: string;           // no pasa nada si por ahora todas son "/app"
  text: string;
  highlightSelector: string;
  placement: TooltipPlacement;
}

export const adminTutorialSteps: TutorialStep[] = [
  // ---------- SERVICIOS ----------
  {
    id: 1,
    route: "/app/services",
    text: "Acá comienza todo: esta es la sección de Servicios que ofreces en tu negocio.",
    highlightSelector: "#services-title",
    placement: "bottom",
  },
  {
    id: 2,
    route: "/app/services",
    text: "Aquí ingresas el nombre del servicio, por ejemplo: Corte de pelo.",
    highlightSelector: "#service-name-input",
    placement: "top",
  },
  {
    id: 3,
    route: "/app/services",
    text: "Aquí defines el precio del servicio.",
    highlightSelector: "#service-price-input",
    placement: "top",
  },
  {
    id: 4,
    route: "/app/services",
    text: "La duración del servicio en minutos.",
    highlightSelector: "#service-duration-input",
    placement: "top",
  },
  {
    id: 5,
    route: "/app/services",
    text: "Puedes agregar una descripción opcional para mayor claridad.",
    highlightSelector: "#service-description-input",
    placement: "top",
  },
  {
    id: 6,
    route: "/app/services",
    text: "Aquí creas un nuevo servicio.",
    highlightSelector: "#service-create-button",
    placement: "top",
  },
  {
    id: 7,
    route: "/app/services",
    text: "Y acá ves todos los servicios ya creados.",
    highlightSelector: "#service-list-table",
    placement: "top",
  },
  {
    id: 8,
    route: "/app/services",
    text: "¡Bien! Aquí puedes abrir el menú lateral.",
    highlightSelector: "#sidebar-toggle",
    placement: "right-bottom",
  },
  {
    id: 9,
    route: "/app/services",
    text: "¡Bien! Ahora continúa con Barberos.",
    highlightSelector: "#sidebar-barbers",
    placement: "right",
  },

  // ---------- BARBEROS ----------
  {
    id: 10,
    route: "/app/barbers",
    text: "En esta vista gestionas los barberos asociados a tu peluquería.",
    highlightSelector: "#barbers-title",
    placement: "bottom",
  },
  {
    id: 11,
    route: "/app/barbers",
    text: "Aquí escribes el nombre del barbero y defines si estará activo. Déjalo activo si quieres que aparezca disponible en las reservas.",
    highlightSelector: "#barbers-form",
    placement: "bottom",
  },
  {
    id: 12,
    route: "/app/barbers",
    text: "Cuando tengas el nombre y el estado listos, haz clic aquí para crear el barbero.",
    highlightSelector: "#barber-create-button",
    placement: "top",
  },
  {
    id: 13,
    route: "/app/barbers",
    text: "Esta tabla muestra todos tus barberos registrados y su estado.",
    highlightSelector: "#barbers-table",
    placement: "top",
  },
  {
    id: 14,
    route: "/app/barbers",
    text: "Genial. Ahora abre el menú lateral para continuar con los clientes.",
    highlightSelector: "#sidebar-toggle",
    placement: "right-bottom",
  },
  {
    id: 15,
    route: "/app/barbers",
    text: "Para seguir, ve a 'Clientes' en el menú lateral.",
    highlightSelector: "#sidebar-clients",
    placement: "right",
  },

  // ---------- CLIENTES ----------
  {
    id: 16,
    route: "/app/clients",
    text: "Aquí ves y gestionas todos tus clientes.",
    highlightSelector: "#clients-title",
    placement: "bottom",
  },
  {
    id: 17,
    route: "/app/clients",
    text: "Completa nombre y teléfono del cliente en este bloque.",
    highlightSelector: "#clients-form-name",
    placement: "bottom",
  },
  {
    id: 18,
    route: "/app/clients",
    text: "Genial. Aqui podras crer un cliente.",
    highlightSelector: "#client-create-button",
    placement: "top",
  },
  {
    id: 19,
    route: "/app/clients",
    text: "En esta tabla tienes la lista de clientes, con su información básica.",
    highlightSelector: "#clients-table",
    placement: "top",
  },
  {
    id: 20,
    route: "/app/clients",
    text: "Genial. Ahora abre el menú lateral para continuar con las Reservas.",
    highlightSelector: "#sidebar-toggle",
    placement: "right-bottom",
  },
  {
    id: 21,
    route: "/app/clients",
    text: "Cuando estés listo, abre 'Bookings' en el menú lateral.",
    highlightSelector: "#sidebar-bookings",
    placement: "right",
  },

  // ---------- BOOKINGS ----------
  {
    id: 22,
    route: "/app/bookings",
    text: "Este es tu panel de reservas. Aquí ves todas las citas.",
    highlightSelector: "#title", // ya lo tienes en AdminBookings
    placement: "bottom",
  },
  {
    id: 23,
    route: "/app/bookings",
    text: "Aquí podras seleccionar el cliente que ya habiamos creado",
    highlightSelector: "#new-client",
    placement: "bottom",
  },
  {
    id: 24,
    route: "/app/bookings",
    text: "Aquí podras seleccionar el servicio que ya habiamos creado",
    highlightSelector: "#new-service",
    placement: "bottom",
  },
  {
    id: 25,
    route: "/app/bookings",
    text: "Aquí podras seleccionar la fecha de la reserva",
    highlightSelector: "#new-date",
    placement: "bottom",
  },
  {
    id: 26,
    route: "/app/bookings",
    text: "Aquí podras agregar un nueva reserva",
    highlightSelector: "#booking-add-button",
    placement: "bottom",
  },
  {
    id: 27,
    route: "/app/bookings",
    text: "Aquí creas una nueva reserva manualmente: cliente, servicio y fecha.",
    highlightSelector: "#add-booking",
    placement: "bottom",
  },
  {
    id: 28,
    route: "/app/bookings",
    text: "En esta tabla ves el detalle de cada reserva y puedes cambiar su estado.",
    highlightSelector: "#bookings-table",
    placement: "top",
  },
];
