// Curated demo data for the permanent demo tenant
// All data is fictional — realistic Spanish names, phones, emails

// ==================== CONTACTS (50) ====================
export interface DemoContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
}

export const DEMO_CONTACTS: DemoContact[] = [
  { firstName: "María", lastName: "García López", email: "maria.garcia@gmail.com", phone: "+34 611 223 344", source: "web", tags: ["familia", "baqueira"] },
  { firstName: "Carlos", lastName: "Fernández Ruiz", email: "carlos.fernandez@outlook.es", phone: "+34 622 334 455", source: "groupon", tags: ["groupon", "sierra_nevada"] },
  { firstName: "Ana", lastName: "Martínez Sánchez", email: "ana.martinez@hotmail.com", phone: "+34 633 445 566", source: "web", tags: ["pareja", "baqueira"] },
  { firstName: "Pedro", lastName: "Sánchez Gómez", email: "pedro.sg@gmail.com", phone: "+34 644 556 677", source: "referido", tags: ["familia", "formigal"] },
  { firstName: "Laura", lastName: "Díaz Navarro", email: "laura.diaz@yahoo.es", phone: "+34 655 667 788", source: "llamada", tags: ["grupo", "sierra_nevada"] },
  { firstName: "Javier", lastName: "Romero Torres", email: "javi.romero@gmail.com", phone: "+34 666 778 899", source: "web", tags: ["empresa", "baqueira"] },
  { firstName: "Elena", lastName: "Rodríguez Vega", email: "elena.rv@gmail.com", phone: "+34 677 889 900", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Roberto", lastName: "Jiménez Mora", email: "roberto.j@outlook.es", phone: "+34 688 990 011", source: "groupon", tags: ["groupon", "sierra_nevada"] },
  { firstName: "Patricia", lastName: "Herrera Gil", email: "patricia.h@gmail.com", phone: "+34 699 001 122", source: "web", tags: ["familia", "la_pinilla"] },
  { firstName: "Diego", lastName: "Navarro Castillo", email: "diego.nc@hotmail.com", phone: "+34 610 112 233", source: "llamada", tags: ["solo", "baqueira"] },
  { firstName: "Lucía", lastName: "Moreno Blanco", email: "lucia.moreno@gmail.com", phone: "+34 621 223 334", source: "groupon", tags: ["groupon", "formigal"] },
  { firstName: "Fernando", lastName: "Vega Prieto", email: "fernando.vp@yahoo.es", phone: "+34 632 334 445", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Marta", lastName: "López Castro", email: "marta.lc@gmail.com", phone: "+34 643 445 556", source: "web", tags: ["pareja", "sierra_nevada"] },
  { firstName: "Adrián", lastName: "Ruiz Domingo", email: "adrian.rd@outlook.es", phone: "+34 654 556 667", source: "referido", tags: ["amigos", "baqueira"] },
  { firstName: "Carmen", lastName: "Giménez Peña", email: "carmen.gp@gmail.com", phone: "+34 665 667 778", source: "web", tags: ["familia", "grandvalira"] },
  { firstName: "Álvaro", lastName: "Domínguez Cruz", email: "alvaro.dc@hotmail.com", phone: "+34 676 778 889", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Isabel", lastName: "Torres Reyes", email: "isabel.tr@gmail.com", phone: "+34 687 889 990", source: "llamada", tags: ["familia", "formigal"] },
  { firstName: "Pablo", lastName: "Serrano Flores", email: "pablo.sf@yahoo.es", phone: "+34 698 990 001", source: "web", tags: ["solo", "sierra_nevada"] },
  { firstName: "Sofía", lastName: "Ramírez Ortiz", email: "sofia.ro@gmail.com", phone: "+34 609 001 112", source: "groupon", tags: ["groupon", "la_pinilla"] },
  { firstName: "Daniel", lastName: "Molina León", email: "daniel.ml@outlook.es", phone: "+34 620 112 223", source: "referido", tags: ["grupo", "baqueira"] },
  { firstName: "Cristina", lastName: "Álvarez Marín", email: "cristina.am@gmail.com", phone: "+34 631 223 334", source: "web", tags: ["pareja", "grandvalira"] },
  { firstName: "Hugo", lastName: "Suárez Ramos", email: "hugo.sr@hotmail.com", phone: "+34 642 334 445", source: "groupon", tags: ["groupon", "sierra_nevada"] },
  { firstName: "Raquel", lastName: "Medina Santos", email: "raquel.ms@gmail.com", phone: "+34 653 445 556", source: "llamada", tags: ["familia", "baqueira"] },
  { firstName: "Sergio", lastName: "Vargas Pascual", email: "sergio.vp@yahoo.es", phone: "+34 664 556 667", source: "web", tags: ["empresa", "formigal"] },
  { firstName: "Beatriz", lastName: "Guerrero Nieto", email: "beatriz.gn@gmail.com", phone: "+34 675 667 778", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Iván", lastName: "Muñoz Pardo", email: "ivan.mp@outlook.es", phone: "+34 686 778 889", source: "referido", tags: ["amigos", "sierra_nevada"] },
  { firstName: "Nuria", lastName: "Delgado Vidal", email: "nuria.dv@gmail.com", phone: "+34 697 889 990", source: "web", tags: ["familia", "la_pinilla"] },
  { firstName: "Marcos", lastName: "Fuentes Aguilar", email: "marcos.fa@hotmail.com", phone: "+34 608 990 001", source: "llamada", tags: ["grupo", "grandvalira"] },
  { firstName: "Andrea", lastName: "Iglesias Rubio", email: "andrea.ir@gmail.com", phone: "+34 619 001 112", source: "groupon", tags: ["groupon", "formigal"] },
  { firstName: "Alejandro", lastName: "Crespo Herrero", email: "alex.ch@yahoo.es", phone: "+34 630 112 223", source: "web", tags: ["pareja", "baqueira"] },
  { firstName: "Inés", lastName: "Calvo Montero", email: "ines.cm@gmail.com", phone: "+34 641 223 334", source: "referido", tags: ["familia", "sierra_nevada"] },
  { firstName: "Óscar", lastName: "Peña Cabrera", email: "oscar.pc@outlook.es", phone: "+34 652 334 445", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Silvia", lastName: "Caballero Esteban", email: "silvia.ce@gmail.com", phone: "+34 663 445 556", source: "web", tags: ["solo", "formigal"] },
  { firstName: "Miguel", lastName: "Cortés Bravo", email: "miguel.cb@hotmail.com", phone: "+34 674 556 667", source: "llamada", tags: ["familia", "grandvalira"] },
  { firstName: "Alicia", lastName: "Gallego Campos", email: "alicia.gc@gmail.com", phone: "+34 685 667 778", source: "web", tags: ["pareja", "baqueira"] },
  { firstName: "Rubén", lastName: "Prieto Lara", email: "ruben.pl@yahoo.es", phone: "+34 696 778 889", source: "groupon", tags: ["groupon", "sierra_nevada"] },
  { firstName: "Teresa", lastName: "Moya Lorenzo", email: "teresa.ml@gmail.com", phone: "+34 607 889 990", source: "referido", tags: ["familia", "la_pinilla"] },
  { firstName: "Víctor", lastName: "León Santiago", email: "victor.ls@outlook.es", phone: "+34 618 990 001", source: "web", tags: ["amigos", "baqueira"] },
  { firstName: "Lorena", lastName: "Ramos Benítez", email: "lorena.rb@gmail.com", phone: "+34 629 001 112", source: "groupon", tags: ["groupon", "formigal"] },
  { firstName: "Gonzalo", lastName: "Pastor Rojas", email: "gonzalo.pr@hotmail.com", phone: "+34 640 112 223", source: "llamada", tags: ["grupo", "sierra_nevada"] },
  { firstName: "Clara", lastName: "Sanz Bermejo", email: "clara.sb@gmail.com", phone: "+34 651 223 334", source: "web", tags: ["familia", "grandvalira"] },
  { firstName: "Ricardo", lastName: "Ibáñez Ferrer", email: "ricardo.if@yahoo.es", phone: "+34 662 334 445", source: "groupon", tags: ["groupon", "baqueira"] },
  { firstName: "Esther", lastName: "Arias Cano", email: "esther.ac@gmail.com", phone: "+34 673 445 556", source: "referido", tags: ["pareja", "formigal"] },
  { firstName: "Alberto", lastName: "Blanco Carrasco", email: "alberto.bc@outlook.es", phone: "+34 684 556 667", source: "web", tags: ["solo", "sierra_nevada"] },
  { firstName: "Natalia", lastName: "Peñalver Soto", email: "natalia.ps@gmail.com", phone: "+34 695 667 778", source: "groupon", tags: ["groupon", "la_pinilla"] },
  { firstName: "Jorge", lastName: "Espinosa Vera", email: "jorge.ev@hotmail.com", phone: "+34 606 778 889", source: "llamada", tags: ["empresa", "baqueira"] },
  { firstName: "Pilar", lastName: "Guerrero Abad", email: "pilar.ga@gmail.com", phone: "+34 617 889 990", source: "web", tags: ["familia", "sierra_nevada"] },
  { firstName: "Tomás", lastName: "Herrero Millán", email: "tomas.hm@yahoo.es", phone: "+34 628 990 001", source: "referido", tags: ["amigos", "grandvalira"] },
  { firstName: "Mónica", lastName: "Pascual Vera", email: "monica.pv@gmail.com", phone: "+34 639 001 112", source: "groupon", tags: ["groupon", "formigal"] },
  { firstName: "Rafael", lastName: "Soler Méndez", email: "rafael.sm@outlook.es", phone: "+34 650 112 223", source: "web", tags: ["familia", "baqueira"] },
];

// ==================== RESERVATIONS (50 total: 35 today + 15 historical) ====================
export interface DemoReservation {
  contactIndex: number; // index into DEMO_CONTACTS
  source: "groupon" | "caja" | "web" | "presupuesto";
  station: string;
  daysOffset: number; // 0 = today, negative = past
  schedule: string;
  totalPrice: number;
  status: "pendiente" | "confirmada" | "sin_disponibilidad";
  paymentMethod?: string;
  couponCode?: string;
  notes?: string;
  services: string;
}

// Today's reservas (35)
const TODAY_RESERVATIONS: DemoReservation[] = [
  // 12 Groupon (8 confirmadas, 2 sin disponibilidad, 2 pendientes)
  { contactIndex: 6, source: "groupon", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-8834", services: "Cursillo + alquiler equipo", notes: "Principiante absoluta" },
  { contactIndex: 7, source: "groupon", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-9921", services: "Cursillo + alquiler equipo" },
  { contactIndex: 10, source: "groupon", station: "formigal", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-5567", services: "Cursillo + alquiler equipo" },
  { contactIndex: 11, source: "groupon", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 275, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-3341", services: "Cursillo + equipo + forfait", notes: "Nivel intermedio" },
  { contactIndex: 15, source: "groupon", station: "baqueira", daysOffset: 0, schedule: "15:00-17:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-7712", services: "Cursillo + alquiler equipo" },
  { contactIndex: 18, source: "groupon", station: "la_pinilla", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 149, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-2245", services: "Cursillo + alquiler equipo" },
  { contactIndex: 21, source: "groupon", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-6698", services: "Cursillo + alquiler equipo" },
  { contactIndex: 24, source: "groupon", station: "baqueira", daysOffset: 0, schedule: "15:00-17:00", totalPrice: 275, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-1189", services: "Cursillo + equipo + forfait" },
  { contactIndex: 28, source: "groupon", station: "formigal", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "sin_disponibilidad", paymentMethod: "groupon", couponCode: "GRP-4420", services: "Cursillo + alquiler equipo", notes: "Sin plazas cursillo mañana" },
  { contactIndex: 31, source: "groupon", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "sin_disponibilidad", paymentMethod: "groupon", couponCode: "GRP-8856", services: "Cursillo + alquiler equipo", notes: "Aforo completo" },
  { contactIndex: 35, source: "groupon", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "pendiente", paymentMethod: "groupon", couponCode: "GRP-5501", services: "Cursillo + alquiler equipo" },
  { contactIndex: 38, source: "groupon", station: "formigal", daysOffset: 0, schedule: "15:00-17:00", totalPrice: 149, status: "pendiente", paymentMethod: "groupon", couponCode: "GRP-9934", services: "Cursillo + alquiler equipo" },
  // 10 Venta en caja (all confirmadas)
  { contactIndex: 9, source: "caja", station: "baqueira", daysOffset: 0, schedule: "10:00-14:00", totalPrice: 120, status: "confirmada", paymentMethod: "efectivo", services: "Forfait día completo" },
  { contactIndex: 3, source: "caja", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 240, status: "confirmada", paymentMethod: "tarjeta", services: "Equipo familia + forfait", notes: "Familia 4 personas" },
  { contactIndex: 13, source: "caja", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "efectivo", services: "Cursillo + equipo" },
  { contactIndex: 19, source: "caja", station: "formigal", daysOffset: 0, schedule: "09:00-14:00", totalPrice: 360, status: "confirmada", paymentMethod: "tarjeta", services: "SnowCamp día completo", notes: "Grupo 3 niños" },
  { contactIndex: 25, source: "caja", station: "baqueira", daysOffset: 0, schedule: "10:00-12:00", totalPrice: 70, status: "confirmada", paymentMethod: "efectivo", services: "Clase particular 1h" },
  { contactIndex: 27, source: "caja", station: "grandvalira", daysOffset: 0, schedule: "10:00-14:00", totalPrice: 95, status: "confirmada", paymentMethod: "tarjeta", services: "Forfait + locker" },
  { contactIndex: 32, source: "caja", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 56, status: "confirmada", paymentMethod: "efectivo", services: "Alquiler equipo 1 día" },
  { contactIndex: 39, source: "caja", station: "baqueira", daysOffset: 0, schedule: "15:00-17:00", totalPrice: 145, status: "confirmada", paymentMethod: "tarjeta", services: "Clase particular 2h x 2 personas" },
  { contactIndex: 43, source: "caja", station: "la_pinilla", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 108, status: "confirmada", paymentMethod: "efectivo", services: "Cursillo infantil + equipo" },
  { contactIndex: 45, source: "caja", station: "baqueira", daysOffset: 0, schedule: "13:00-14:30", totalPrice: 28, status: "confirmada", paymentMethod: "efectivo", services: "Menú montaña" },
  // 8 Desde presupuesto (6 confirmadas, 2 pendientes)
  { contactIndex: 0, source: "presupuesto", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 1240, status: "confirmada", paymentMethod: "transferencia", services: "Pack familia completo 3 días", notes: "Familia 4 — equipo+forfait+cursillo" },
  { contactIndex: 4, source: "presupuesto", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 890, status: "confirmada", paymentMethod: "tarjeta", services: "Pack grupo 5 personas", notes: "Grupo amigos nivel intermedio" },
  { contactIndex: 14, source: "presupuesto", station: "grandvalira", daysOffset: 0, schedule: "09:00-17:00", totalPrice: 2100, status: "confirmada", paymentMethod: "transferencia", services: "Pack familia semana", notes: "Familia 4, 5 días completos" },
  { contactIndex: 22, source: "presupuesto", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 560, status: "confirmada", paymentMethod: "tarjeta", services: "Pack pareja 3 días" },
  { contactIndex: 29, source: "presupuesto", station: "baqueira", daysOffset: 0, schedule: "10:00-14:00", totalPrice: 450, status: "confirmada", paymentMethod: "transferencia", services: "Pack esquí + après-ski" },
  { contactIndex: 34, source: "presupuesto", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 720, status: "confirmada", paymentMethod: "tarjeta", services: "Pack snowcamp + forfait" },
  { contactIndex: 40, source: "presupuesto", station: "formigal", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 680, status: "pendiente", services: "Pack familia 2 días", notes: "Pendiente confirmar fechas" },
  { contactIndex: 46, source: "presupuesto", station: "baqueira", daysOffset: 0, schedule: "09:00-17:00", totalPrice: 1560, status: "pendiente", services: "Pack empresa 6 personas", notes: "Esperando aprobación empresa" },
  // 5 Web (3 confirmadas, 2 pendientes)
  { contactIndex: 2, source: "web", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 275, status: "confirmada", paymentMethod: "tarjeta", services: "Cursillo + equipo + forfait" },
  { contactIndex: 12, source: "web", station: "sierra_nevada", daysOffset: 0, schedule: "10:00-14:00", totalPrice: 420, status: "confirmada", paymentMethod: "tarjeta", services: "Pack pareja 2 días" },
  { contactIndex: 20, source: "web", station: "baqueira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "tarjeta", services: "Cursillo + equipo" },
  { contactIndex: 33, source: "web", station: "grandvalira", daysOffset: 0, schedule: "10:00-13:00", totalPrice: 320, status: "pendiente", services: "Pack familia fin de semana", notes: "Reserva web pendiente pago" },
  { contactIndex: 41, source: "web", station: "baqueira", daysOffset: 0, schedule: "15:00-17:00", totalPrice: 145, status: "pendiente", services: "Clase particular 2h" },
];

// Historical reservations (15 from past 7 days)
const HISTORICAL_RESERVATIONS: DemoReservation[] = [
  { contactIndex: 1, source: "groupon", station: "sierra_nevada", daysOffset: -1, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-1100", services: "Cursillo + equipo" },
  { contactIndex: 5, source: "caja", station: "baqueira", daysOffset: -1, schedule: "10:00-14:00", totalPrice: 275, status: "confirmada", paymentMethod: "efectivo", services: "Equipo + forfait" },
  { contactIndex: 8, source: "web", station: "la_pinilla", daysOffset: -1, schedule: "10:00-13:00", totalPrice: 149, status: "confirmada", paymentMethod: "tarjeta", services: "Cursillo + equipo" },
  { contactIndex: 16, source: "presupuesto", station: "baqueira", daysOffset: -2, schedule: "10:00-13:00", totalPrice: 890, status: "confirmada", paymentMethod: "transferencia", services: "Pack familia 2 días" },
  { contactIndex: 23, source: "groupon", station: "formigal", daysOffset: -2, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-3378", services: "Cursillo + equipo" },
  { contactIndex: 26, source: "caja", station: "sierra_nevada", daysOffset: -3, schedule: "10:00-13:00", totalPrice: 120, status: "confirmada", paymentMethod: "efectivo", services: "Forfait día" },
  { contactIndex: 30, source: "web", station: "baqueira", daysOffset: -3, schedule: "10:00-13:00", totalPrice: 560, status: "confirmada", paymentMethod: "tarjeta", services: "Pack pareja 3 días" },
  { contactIndex: 36, source: "groupon", station: "la_pinilla", daysOffset: -4, schedule: "10:00-13:00", totalPrice: 149, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-7744", services: "Cursillo + equipo" },
  { contactIndex: 37, source: "caja", station: "baqueira", daysOffset: -4, schedule: "10:00-14:00", totalPrice: 240, status: "confirmada", paymentMethod: "tarjeta", services: "Equipo familia" },
  { contactIndex: 42, source: "presupuesto", station: "grandvalira", daysOffset: -5, schedule: "09:00-17:00", totalPrice: 1800, status: "confirmada", paymentMethod: "transferencia", services: "Pack semana grupo" },
  { contactIndex: 44, source: "groupon", station: "sierra_nevada", daysOffset: -5, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-2267", services: "Cursillo + equipo" },
  { contactIndex: 47, source: "caja", station: "baqueira", daysOffset: -6, schedule: "10:00-12:00", totalPrice: 70, status: "confirmada", paymentMethod: "efectivo", services: "Clase particular" },
  { contactIndex: 48, source: "web", station: "formigal", daysOffset: -6, schedule: "10:00-13:00", totalPrice: 275, status: "confirmada", paymentMethod: "tarjeta", services: "Cursillo + equipo + forfait" },
  { contactIndex: 49, source: "groupon", station: "baqueira", daysOffset: -7, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", couponCode: "GRP-8890", services: "Cursillo + equipo" },
  { contactIndex: 17, source: "caja", station: "sierra_nevada", daysOffset: -7, schedule: "10:00-14:00", totalPrice: 95, status: "confirmada", paymentMethod: "efectivo", services: "Forfait + locker" },
];

export const DEMO_RESERVATIONS = [...TODAY_RESERVATIONS, ...HISTORICAL_RESERVATIONS];

// ==================== QUOTES / PRESUPUESTOS (12) ====================
export interface DemoQuote {
  contactIndex: number;
  destination: string;
  checkIn: number; // days from now
  checkOut: number; // days from now
  adults: number;
  children: number;
  status: "nuevo" | "en_proceso" | "enviado" | "aceptado";
  totalAmount: number;
  wantsForfait: boolean;
  wantsClases: boolean;
  wantsEquipment: boolean;
  notes?: string;
}

export const DEMO_QUOTES: DemoQuote[] = [
  // 3 Nuevo
  { contactIndex: 0, destination: "baqueira", checkIn: 5, checkOut: 10, adults: 2, children: 2, status: "nuevo", totalAmount: 2840, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Primera vez esquiando. Quieren algo cómodo y con clases para los niños." },
  { contactIndex: 5, destination: "sierra_nevada", checkIn: 8, checkOut: 11, adults: 6, children: 0, status: "nuevo", totalAmount: 3200, wantsForfait: true, wantsClases: false, wantsEquipment: true, notes: "Viaje de empresa. 6 adultos nivel intermedio." },
  { contactIndex: 14, destination: "grandvalira", checkIn: 12, checkOut: 17, adults: 2, children: 2, status: "nuevo", totalAmount: 4500, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Familia con presupuesto alto, quieren pack premium." },
  // 4 Enviado
  { contactIndex: 4, destination: "sierra_nevada", checkIn: 3, checkOut: 6, adults: 4, children: 0, status: "enviado", totalAmount: 1680, wantsForfait: true, wantsClases: false, wantsEquipment: true, notes: "Grupo de amigos, nivel intermedio." },
  { contactIndex: 8, destination: "la_pinilla", checkIn: 6, checkOut: 8, adults: 2, children: 1, status: "enviado", totalAmount: 620, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Familia fin de semana." },
  { contactIndex: 19, destination: "baqueira", checkIn: 10, checkOut: 14, adults: 3, children: 0, status: "enviado", totalAmount: 1950, wantsForfait: true, wantsClases: false, wantsEquipment: true, notes: "Grupo amigos nivel avanzado." },
  { contactIndex: 30, destination: "formigal", checkIn: 4, checkOut: 7, adults: 2, children: 0, status: "enviado", totalAmount: 890, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Pareja principiante." },
  // 3 Aceptado
  { contactIndex: 2, destination: "baqueira", checkIn: 2, checkOut: 5, adults: 2, children: 0, status: "aceptado", totalAmount: 1240, wantsForfait: true, wantsClases: false, wantsEquipment: true, notes: "Viaje de pareja, ya pagado." },
  { contactIndex: 22, destination: "baqueira", checkIn: 1, checkOut: 4, adults: 2, children: 3, status: "aceptado", totalAmount: 3100, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Familia numerosa." },
  { contactIndex: 36, destination: "la_pinilla", checkIn: 3, checkOut: 4, adults: 1, children: 0, status: "aceptado", totalAmount: 183, wantsForfait: false, wantsClases: true, wantsEquipment: true, notes: "Solo traveler, cursillo individual." },
  // 2 En Proceso
  { contactIndex: 3, destination: "formigal", checkIn: 7, checkOut: 12, adults: 2, children: 3, status: "en_proceso", totalAmount: 3450, wantsForfait: true, wantsClases: true, wantsEquipment: true, notes: "Familia con presupuesto ajustado." },
  { contactIndex: 23, destination: "sierra_nevada", checkIn: 5, checkOut: 8, adults: 8, children: 0, status: "en_proceso", totalAmount: 4200, wantsForfait: true, wantsClases: false, wantsEquipment: true, notes: "Evento empresa, team building." },
];

// ==================== PIPELINE DEALS (25) ====================
export interface DemoDeal {
  contactIndex: number;
  stage: "nuevo_lead" | "contactado" | "presupuesto_enviado" | "aceptado" | "cerrado";
  value: number;
  name: string;
}

export const DEMO_DEALS: DemoDeal[] = [
  // Nuevo Lead (8)
  { contactIndex: 0, stage: "nuevo_lead", value: 2840, name: "Pack familia Baqueira 5 días" },
  { contactIndex: 5, stage: "nuevo_lead", value: 3200, name: "Grupo empresa Sierra Nevada" },
  { contactIndex: 14, stage: "nuevo_lead", value: 4500, name: "Pack premium Grandvalira" },
  { contactIndex: 27, stage: "nuevo_lead", value: 1200, name: "Grupo 4 amigos Grandvalira" },
  { contactIndex: 32, stage: "nuevo_lead", value: 560, name: "Forfait + equipo Formigal" },
  { contactIndex: 39, stage: "nuevo_lead", value: 890, name: "Pack pareja Sierra Nevada" },
  { contactIndex: 44, stage: "nuevo_lead", value: 375, name: "Cursillo + equipo Sierra Nevada" },
  { contactIndex: 48, stage: "nuevo_lead", value: 680, name: "Pack SnowCamp Formigal" },
  // Contactado (6)
  { contactIndex: 4, stage: "contactado", value: 1680, name: "Grupo amigos Sierra Nevada" },
  { contactIndex: 8, stage: "contactado", value: 620, name: "Familia fin semana La Pinilla" },
  { contactIndex: 16, stage: "contactado", value: 1500, name: "Familia Formigal 3 días" },
  { contactIndex: 19, stage: "contactado", value: 1950, name: "Grupo avanzado Baqueira" },
  { contactIndex: 30, stage: "contactado", value: 890, name: "Pareja principiante Formigal" },
  { contactIndex: 42, stage: "contactado", value: 2100, name: "Pack semana Grandvalira" },
  // Presupuesto Enviado (5)
  { contactIndex: 3, stage: "presupuesto_enviado", value: 3450, name: "Familia Formigal semana" },
  { contactIndex: 23, stage: "presupuesto_enviado", value: 4200, name: "Team building Sierra Nevada" },
  { contactIndex: 33, stage: "presupuesto_enviado", value: 1800, name: "Pack familia Grandvalira" },
  { contactIndex: 37, stage: "presupuesto_enviado", value: 720, name: "Pack 2 días Baqueira" },
  { contactIndex: 46, stage: "presupuesto_enviado", value: 2400, name: "Pack empresa Baqueira" },
  // Aceptado (4)
  { contactIndex: 2, stage: "aceptado", value: 1240, name: "Pareja Baqueira 3 días" },
  { contactIndex: 22, stage: "aceptado", value: 3100, name: "Familia numerosa Baqueira" },
  { contactIndex: 36, stage: "aceptado", value: 183, name: "Cursillo individual La Pinilla" },
  { contactIndex: 40, stage: "aceptado", value: 1560, name: "Pack familia Formigal" },
  // Cerrado (2)
  { contactIndex: 29, stage: "cerrado", value: 450, name: "Pack après-ski Baqueira" },
  { contactIndex: 34, stage: "cerrado", value: 720, name: "SnowCamp + forfait Sierra Nevada" },
];

// ==================== CONVERSATIONS (20) ====================
export interface DemoMessage {
  direction: "inbound" | "outbound";
  body: string;
  minutesAgo: number;
}

export interface DemoConversation {
  contactIndex: number;
  type: "WhatsApp" | "SMS";
  messages: DemoMessage[];
}

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  // 5 New inquiries
  { contactIndex: 0, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola! Vi en la web que ofrecéis packs de esquí para familias. Somos 2 adultos y 2 niños, queremos ir a Baqueira en marzo.", minutesAgo: 45 },
    { direction: "outbound", body: "¡Hola María! Claro que sí, tenemos packs familia muy completos para Baqueira. ¿Qué fechas tenéis en mente?", minutesAgo: 38 },
    { direction: "inbound", body: "Del 22 al 27 de marzo, 5 días. Los niños no han esquiado nunca, necesitarían cursillo y equipo.", minutesAgo: 30 },
    { direction: "outbound", body: "Perfecto, os preparo un presupuesto con equipo completo + cursillo para los peques + forfait para todos. Os lo envío hoy mismo.", minutesAgo: 25 },
  ]},
  { contactIndex: 5, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Buenos días, somos una empresa y queremos organizar un team building de esquí en Sierra Nevada. Seríamos 6 personas.", minutesAgo: 120 },
    { direction: "outbound", body: "¡Buenos días! Qué buen plan para el equipo. ¿Tenéis fechas previstas? Tenemos packs especiales para empresas.", minutesAgo: 105 },
    { direction: "inbound", body: "Primera semana de abril si es posible, 3 días. Nivel variado.", minutesAgo: 90 },
  ]},
  { contactIndex: 14, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola, estamos buscando un pack premium para Grandvalira, 5 días, familia de 4. ¿Qué opciones hay?", minutesAgo: 180 },
    { direction: "outbound", body: "¡Hola Carmen! Para Grandvalira tenemos packs muy completos. ¿Los niños necesitan escuela de esquí?", minutesAgo: 165 },
    { direction: "inbound", body: "Sí, ambos niños de 8 y 10 años. Queremos todo incluido: equipo, forfait, clases y si es posible SnowCamp.", minutesAgo: 150 },
  ]},
  { contactIndex: 27, type: "SMS", messages: [
    { direction: "inbound", body: "Info precios grupo 4 personas Grandvalira fin semana", minutesAgo: 240 },
    { direction: "outbound", body: "Hola Marcos, para un fin de semana en Grandvalira (4 pers) el pack con forfait+equipo parte de 300€/persona. ¿Necesitáis clases?", minutesAgo: 220 },
  ]},
  { contactIndex: 44, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola, ¿tienen disponibilidad para cursillos en La Pinilla este fin de semana?", minutesAgo: 60 },
    { direction: "outbound", body: "¡Hola Natalia! Sí, tenemos plazas para cursillo el sábado. ¿Adulto o infantil?", minutesAgo: 50 },
    { direction: "inbound", body: "Adulto, sería mi primera vez. ¿Incluye equipo?", minutesAgo: 42 },
  ]},
  // 4 Quote negotiations
  { contactIndex: 4, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Laura, te envío el presupuesto actualizado para Sierra Nevada: 4 personas, 3 días, forfait + equipo = 1.680€", minutesAgo: 300 },
    { direction: "inbound", body: "Me parece un poco alto. ¿Hay algún descuento para grupos?", minutesAgo: 280 },
    { direction: "outbound", body: "Puedo aplicar un 10% de descuento en el alquiler de equipo por ser grupo de 4. El total quedaría en 1.520€.", minutesAgo: 260 },
    { direction: "inbound", body: "Ok, lo consulto con los demás y te confirmo mañana.", minutesAgo: 240 },
  ]},
  { contactIndex: 3, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Pedro, aquí tienes el presupuesto para Formigal: familia 2+3, semana completa, todo incluido = 3.450€", minutesAgo: 400 },
    { direction: "inbound", body: "Es un poco más de lo que teníamos pensado gastar. ¿Se puede ajustar algo?", minutesAgo: 380 },
    { direction: "outbound", body: "Podemos quitar el forfait del día de llegada (solo medio día de esquí) y bajar los días de equipo infantil. Así quedaría en 2.950€.", minutesAgo: 360 },
    { direction: "inbound", body: "Eso está mejor. ¿Me puedes enviar el presupuesto actualizado por email?", minutesAgo: 340 },
    { direction: "outbound", body: "¡Claro! Te lo envío ahora mismo a pedro.sg@gmail.com", minutesAgo: 335 },
  ]},
  { contactIndex: 19, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Daniel, presupuesto listo para Baqueira: 3 personas, 4 días, nivel avanzado = 1.950€ (forfait + equipo alta gama)", minutesAgo: 500 },
    { direction: "inbound", body: "¿El equipo alta gama incluye esquís de competición?", minutesAgo: 480 },
    { direction: "outbound", body: "Sí, equipo alta calidad con esquís de gama alta, botas de rendimiento y casco. Lo mejor que tenemos.", minutesAgo: 470 },
  ]},
  { contactIndex: 30, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Inés, el presupuesto para Formigal: pareja principiante, 3 días con cursillo + equipo + forfait = 890€", minutesAgo: 600 },
    { direction: "inbound", body: "Perfecto, nos parece bien. ¿Cómo hacemos para confirmar?", minutesAgo: 580 },
    { direction: "outbound", body: "Te envío un link de pago por transferencia. Una vez confirmado el pago, os reservo todo.", minutesAgo: 570 },
  ]},
  // 3 Groupon submissions
  { contactIndex: 6, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola, he comprado un cupón Groupon de esquí. Código: GRP-8834. ¿Cómo lo canjeo?", minutesAgo: 1440 },
    { direction: "outbound", body: "¡Hola Elena! Recibido el cupón GRP-8834. ¿Para qué fecha quieres reservar?", minutesAgo: 1400 },
    { direction: "inbound", body: "Para mañana si hay sitio, estación Baqueira, turno de mañana", minutesAgo: 1380 },
    { direction: "outbound", body: "¡Confirmado! Reserva para mañana en Baqueira, 10:00-13:00. Cursillo + alquiler equipo. Llega 15 min antes para recoger el material.", minutesAgo: 1370 },
    { direction: "inbound", body: "¡Genial! ¿Necesito llevar algo?", minutesAgo: 1360 },
    { direction: "outbound", body: "Solo ropa de abrigo cómoda y el cupón (en el móvil vale). Nosotros te damos todo el equipo: esquís, botas, bastones y casco.", minutesAgo: 1350 },
  ]},
  { contactIndex: 7, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Buenas tardes, tengo cupón Groupon GRP-9921 para Sierra Nevada. ¿Hay disponibilidad este sábado?", minutesAgo: 1200 },
    { direction: "outbound", body: "¡Hola Roberto! Sí, hay plazas para el sábado en Sierra Nevada. ¿Turno de mañana o tarde?", minutesAgo: 1180 },
    { direction: "inbound", body: "Mañana mejor, a las 10:00", minutesAgo: 1160 },
    { direction: "outbound", body: "Perfecto, reservado. Sábado 10:00 en Sierra Nevada. ¡Pásalo genial!", minutesAgo: 1150 },
  ]},
  { contactIndex: 10, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola! Cupón GRP-5567, quiero ir a Formigal. ¿Hay sitio el próximo martes?", minutesAgo: 800 },
    { direction: "outbound", body: "¡Hola Lucía! Martes hay disponibilidad en Formigal. Cursillo 10:00-13:00 + equipo completo. ¿Te reservo?", minutesAgo: 780 },
    { direction: "inbound", body: "Sí por favor!", minutesAgo: 770 },
  ]},
  // 3 Reservation confirmations
  { contactIndex: 2, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Ana, tu reserva está confirmada: Baqueira, 22-25 marzo, pareja. Equipo + forfait. Te envío confirmación por email.", minutesAgo: 2000 },
    { direction: "inbound", body: "¡Perfecto! ¿A qué hora tenemos que estar allí?", minutesAgo: 1980 },
    { direction: "outbound", body: "A las 9:45 en la oficina de Skicenter (edificio principal de Baqueira). Os damos el equipo y os indicamos dónde empezar.", minutesAgo: 1970 },
    { direction: "inbound", body: "Genial, muchas gracias!", minutesAgo: 1960 },
  ]},
  { contactIndex: 22, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Raquel, confirmado todo para tu familia en Baqueira: 2 adultos + 3 niños, 3 días con cursillo y equipo completo.", minutesAgo: 2500 },
    { direction: "inbound", body: "¡Estupendo! Los niños están emocionadísimos 😊", minutesAgo: 2480 },
    { direction: "outbound", body: "¡Van a pasarlo genial! Los profes de cursillo infantil son los mejores. Recordad traer gafas de sol y protector solar.", minutesAgo: 2470 },
  ]},
  { contactIndex: 29, type: "WhatsApp", messages: [
    { direction: "outbound", body: "Alejandro, reserva confirmada. Pack esquí + après-ski en Baqueira. Incluye menú montaña y trineos nocturnos.", minutesAgo: 3000 },
    { direction: "inbound", body: "Qué bien! ¿Los trineos son a qué hora?", minutesAgo: 2980 },
    { direction: "outbound", body: "Los trineos nocturnos son a las 19:00. El menú montaña se sirve a las 13:00 en el restaurante de pistas.", minutesAgo: 2970 },
  ]},
  // 2 Complaints/Issues
  { contactIndex: 28, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola, acabo de ver que mi reserva sale como 'sin disponibilidad'. ¿Qué ha pasado?", minutesAgo: 100 },
    { direction: "outbound", body: "Hola Andrea, lo sentimos mucho. El cursillo de Formigal por la mañana se ha llenado. ¿Te va bien el turno de tarde (15:00-17:00)?", minutesAgo: 85 },
    { direction: "inbound", body: "La tarde me va mal. ¿Puedo cambiar a otro día?", minutesAgo: 75 },
    { direction: "outbound", body: "Claro, el miércoles hay plazas por la mañana. ¿Te cambio a miércoles 10:00-13:00?", minutesAgo: 65 },
    { direction: "inbound", body: "Sí, perfecto, cámbiame al miércoles", minutesAgo: 55 },
  ]},
  { contactIndex: 31, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Mi cupón GRP-8856 dice sin disponibilidad para Baqueira. ¿No hay nada?", minutesAgo: 200 },
    { direction: "outbound", body: "Hola Óscar, lamentamos la situación. Baqueira está completo hoy. Te puedo ofrecer: 1) Cambio a Sierra Nevada mañana, o 2) Reprogramar para la semana que viene en Baqueira.", minutesAgo: 180 },
    { direction: "inbound", body: "Sierra Nevada mañana me vale, si no hay problema con el cupón", minutesAgo: 160 },
    { direction: "outbound", body: "Sin problema, el cupón es válido para cualquier estación. Te reservo Sierra Nevada mañana a las 10:00. ¡Confirmado!", minutesAgo: 150 },
  ]},
  // 2 Post-service thank you
  { contactIndex: 1, type: "WhatsApp", messages: [
    { direction: "inbound", body: "¡Muchas gracias por todo! Lo pasamos genial en Sierra Nevada. Los monitores fueron increíbles.", minutesAgo: 1500 },
    { direction: "outbound", body: "¡Nos alegra mucho Carlos! Fue un placer teneros. ¿Queréis repetir? Tenemos un 15% de descuento para clientes que repiten 😉", minutesAgo: 1480 },
    { direction: "inbound", body: "Seguro que repetimos! Ya os contactaremos para el próximo viaje.", minutesAgo: 1460 },
  ]},
  { contactIndex: 17, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Pablo aquí. Solo quería deciros que la experiencia en Sierra Nevada fue 10/10. Gracias!", minutesAgo: 2200 },
    { direction: "outbound", body: "¡Muchas gracias Pablo! Es genial saber que lo disfrutaste. Si necesitas algo para la próxima, aquí estamos.", minutesAgo: 2180 },
  ]},
  // 1 Referral
  { contactIndex: 13, type: "WhatsApp", messages: [
    { direction: "inbound", body: "Hola! Mi amigo Adrián me ha recomendado. Quiero organizar algo parecido en Baqueira para un grupo de 5.", minutesAgo: 350 },
    { direction: "outbound", body: "¡Hola! Qué bien que Adrián os recomendó. Para un grupo de 5 en Baqueira tenemos muy buenas opciones. ¿Qué nivel tenéis?", minutesAgo: 330 },
    { direction: "inbound", body: "Somos todos intermedios, ya hemos esquiado varias veces. Queríamos 3 días con forfait y equipo.", minutesAgo: 310 },
    { direction: "outbound", body: "Perfecto, para 5 intermedios en Baqueira 3 días con forfait + equipo sale a unos 390€ por persona. ¿Os preparo presupuesto formal?", minutesAgo: 300 },
    { direction: "inbound", body: "Sí porfa, lo consulto con el grupo y te confirmo.", minutesAgo: 290 },
  ]},
];

// ==================== STATION CAPACITY ====================
export interface DemoCapacity {
  station: string;
  cursillo_max: number;
  cursillo_booked: number;
  clase_max: number;
  clase_booked: number;
}

export const DEMO_CAPACITY: DemoCapacity[] = [
  { station: "baqueira", cursillo_max: 50, cursillo_booked: 43, clase_max: 10, clase_booked: 8 },
  { station: "sierra_nevada", cursillo_max: 30, cursillo_booked: 18, clase_max: 10, clase_booked: 4 },
  { station: "formigal", cursillo_max: 30, cursillo_booked: 12, clase_max: 10, clase_booked: 2 },
  { station: "la_pinilla", cursillo_max: 20, cursillo_booked: 8, clase_max: 5, clase_booked: 1 },
  { station: "grandvalira", cursillo_max: 30, cursillo_booked: 15, clase_max: 10, clase_booked: 3 },
];

// ==================== LEADS (15) ====================
export interface DemoLead {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: "nuevo" | "contactado" | "calificado" | "convertido" | "perdido";
  pipelineStage: string;
  score: number;
  tags: string[];
  notes: string;
  daysOld: number;
  lostReason?: string;
}

export const DEMO_LEADS: DemoLead[] = [
  { name: "Manuel Gutiérrez", email: "manuel.gutierrez@gmail.com", phone: "+34 611 444 555", source: "web", status: "nuevo", pipelineStage: "nuevo", score: 35, tags: ["familia", "baqueira"], notes: "Solicita info pack familia 4 personas, 5 días en marzo.", daysOld: 0 },
  { name: "Patricia Ortiz", email: "patricia.ortiz@outlook.es", phone: "+34 622 555 666", source: "storefront", status: "nuevo", pipelineStage: "nuevo", score: 60, tags: ["pareja", "sierra_nevada"], notes: "Lead desde formulario web. Interesada en pack romántico spa + esquí.", daysOld: 1 },
  { name: "Grupo Aventura BCN", email: "info@grupoaventurabcn.es", phone: "+34 933 222 111", source: "referral", status: "nuevo", pipelineStage: "nuevo", score: 75, tags: ["grupo", "empresa"], notes: "Empresa de eventos quiere paquete grupos 20-30 pax para febrero.", daysOld: 2 },
  { name: "Susana Marín", email: "susana.marin@gmail.com", phone: "+34 644 666 777", source: "web", status: "nuevo", pipelineStage: "nuevo", score: 25, tags: ["solo", "principiante"], notes: "Primera vez esquiando, busca curso intensivo fin de semana.", daysOld: 0 },
  { name: "Ramón Casas", email: "ramon.casas@yahoo.es", phone: "+34 655 777 888", source: "manual", status: "contactado", pipelineStage: "contactado", score: 50, tags: ["familia", "formigal"], notes: "Llamado el día 28. Pendiente de enviar presupuesto familia 5 pax.", daysOld: 4 },
  { name: "Lourdes Vázquez", email: "lourdes.vazquez@gmail.com", phone: "+34 666 888 999", source: "groupon", status: "contactado", pipelineStage: "contactado", score: 65, tags: ["groupon", "baqueira"], notes: "Cupón canjeado, quiere ampliar a fin de semana completo.", daysOld: 3 },
  { name: "Equipo Tech&Co", email: "people@techandco.es", phone: "+34 911 333 444", source: "import", status: "contactado", pipelineStage: "contactado", score: 80, tags: ["empresa", "team_building"], notes: "Empresa tecnológica 12 personas. Esperando aprobación interna del CFO.", daysOld: 5 },
  { name: "Beatriz Lago", email: "beatriz.lago@hotmail.com", phone: "+34 677 999 000", source: "web", status: "calificado", pipelineStage: "calificado", score: 85, tags: ["familia", "alta_gama"], notes: "Familia VIP — busca chalet privado + clases particulares 7 días Baqueira.", daysOld: 6 },
  { name: "Antonio Heredia", email: "antonio.heredia@gmail.com", phone: "+34 688 000 111", source: "referral", status: "calificado", pipelineStage: "calificado", score: 90, tags: ["pareja", "luna_de_miel"], notes: "Luna de miel, presupuesto 4000€. Quieren pack premium spa + privado.", daysOld: 7 },
  { name: "Cristina Solano", email: "cristina.solano@outlook.es", phone: "+34 699 111 222", source: "storefront", status: "calificado", pipelineStage: "calificado", score: 70, tags: ["familia", "intermedio"], notes: "Familia 4 con dos adolescentes, quieren snowpark + clases avanzadas.", daysOld: 8 },
  { name: "Diego Alonso", email: "diego.alonso@gmail.com", phone: "+34 610 222 333", source: "web", status: "convertido", pipelineStage: "convertido", score: 95, tags: ["pareja", "convertido"], notes: "Convertido en reserva confirmada Sierra Nevada. Total 1240€.", daysOld: 12 },
  { name: "Mireia Ferrer", email: "mireia.ferrer@gmail.com", phone: "+34 621 333 444", source: "groupon", status: "convertido", pipelineStage: "convertido", score: 80, tags: ["familia", "convertido"], notes: "Convertido — pack familia La Pinilla 3 días.", daysOld: 14 },
  { name: "Gabriel Ros", email: "gabriel.ros@hotmail.com", phone: "+34 632 444 555", source: "manual", status: "perdido", pipelineStage: "perdido", score: 20, tags: ["solo", "perdido"], notes: "No respondió a llamadas tras envío de presupuesto. Marcar para seguimiento Q4.", daysOld: 20, lostReason: "No respuesta tras 3 intentos" },
  { name: "Asociación Esquí Madrid", email: "presidencia@esquimadrid.org", phone: "+34 915 666 777", source: "import", status: "perdido", pipelineStage: "perdido", score: 40, tags: ["asociacion", "perdido"], notes: "Eligieron competidor por precio. Volver a contactar en septiembre.", daysOld: 18, lostReason: "Precio competencia más bajo" },
  { name: "Luis Carballo", email: "luis.carballo@gmail.com", phone: "+34 643 555 666", source: "web", status: "perdido", pipelineStage: "perdido", score: 15, tags: ["solo", "perdido"], notes: "Cancelado por motivos personales. No reabrir.", daysOld: 25, lostReason: "Motivos personales" },
];

// ==================== EXTRA INSTRUCTORS (3 more, plus the existing 3 = 6 total) ====================
export interface DemoExtraInstructor {
  email: string;
  name: string;
  tdLevel: string;
  station: string;
  disciplines: string[];
  specialties: string[];
  languages: string[];
  hourlyRate: number;
  perStudentBonus: number;
  certNumber: string;
  contractType: string;
}

export const DEMO_EXTRA_INSTRUCTORS: DemoExtraInstructor[] = [
  { email: "pablo.sanz@demo.skicenter.com", name: "Pablo Sanz Mora", tdLevel: "TD3", station: "sierra_nevada", disciplines: ["esqui", "telemark"], specialties: ["competition"], languages: ["es", "en"], hourlyRate: 30, perStudentBonus: 3.5, certNumber: "TD3-2022-0301", contractType: "fijo_discontinuo" },
  { email: "marta.cano@demo.skicenter.com", name: "Marta Cano Vidal", tdLevel: "TD2", station: "baqueira", disciplines: ["esqui"], specialties: ["children", "adaptive"], languages: ["es", "fr", "en"], hourlyRate: 24, perStudentBonus: 2.5, certNumber: "TD2-2024-0788", contractType: "fijo_discontinuo" },
  { email: "jorge.velasco@demo.skicenter.com", name: "Jorge Velasco Pinto", tdLevel: "TD1", station: "formigal", disciplines: ["snow", "freestyle"], specialties: ["children"], languages: ["es"], hourlyRate: 18, perStudentBonus: 2, certNumber: "TD1-2025-1102", contractType: "temporal" },
];

// ==================== INTERNAL MESSAGES (5 conversations) ====================
export interface DemoInternalMessage {
  fromEmail: string;
  toEmail: string;
  body: string;
  hoursAgo: number;
  isRead: boolean;
}

export const DEMO_INTERNAL_MESSAGES: DemoInternalMessage[] = [
  // Admin ↔ Profesor (1 - daily check-in)
  { fromEmail: "demo@skicenter.com", toEmail: "profesor@demo.skicenter.com", body: "Hola Alejandro, ¿cómo va el día? ¿Necesitas refuerzo en los grupos infantiles?", hoursAgo: 6, isRead: true },
  { fromEmail: "profesor@demo.skicenter.com", toEmail: "demo@skicenter.com", body: "Todo bien, gracias. Hay 2 niños extra en el grupo A2, voy a pedir apoyo a Marta.", hoursAgo: 5, isRead: true },
  { fromEmail: "demo@skicenter.com", toEmail: "profesor@demo.skicenter.com", body: "Perfecto. Recuerda que mañana cambia el horario de tu primera clase a las 9:30.", hoursAgo: 4, isRead: false },
  // Admin ↔ Natalia (2 - sales question)
  { fromEmail: "natalia@demo.skicenter.com", toEmail: "demo@skicenter.com", body: "Tengo una familia que quiere descuento por grupo de 6. ¿Aplico el 10% del último presupuesto enviado?", hoursAgo: 12, isRead: true },
  { fromEmail: "demo@skicenter.com", toEmail: "natalia@demo.skicenter.com", body: "Sí, máximo 10% en grupos de 6+. Si llegan a 8 personas puedes subir a 12%.", hoursAgo: 11, isRead: true },
  { fromEmail: "natalia@demo.skicenter.com", toEmail: "demo@skicenter.com", body: "Genial, gracias. Mando el presupuesto actualizado.", hoursAgo: 10, isRead: true },
  // Admin ↔ Manager (3 - operational)
  { fromEmail: "manager@demo.skicenter.com", toEmail: "demo@skicenter.com", body: "El alquiler de Baqueira está al 90% para mañana. ¿Movilizamos stock de Sierra Nevada?", hoursAgo: 24, isRead: true },
  { fromEmail: "demo@skicenter.com", toEmail: "manager@demo.skicenter.com", body: "Sí, pide a Carlos que mande 30 pares esquís adulto + botas mañana a primera hora.", hoursAgo: 23, isRead: true },
  // Profesor ↔ Natalia (4 - schedule swap)
  { fromEmail: "profesor@demo.skicenter.com", toEmail: "natalia@demo.skicenter.com", body: "Natalia, ¿puedes cubrirme la clase del jueves 13:00? Tengo cita médica.", hoursAgo: 30, isRead: true },
  { fromEmail: "natalia@demo.skicenter.com", toEmail: "profesor@demo.skicenter.com", body: "Sin problema, te cubro. Avisa al admin para que ajuste el cuadrante.", hoursAgo: 29, isRead: false },
  // Admin → Profesor (5 - announcement)
  { fromEmail: "demo@skicenter.com", toEmail: "profesor@demo.skicenter.com", body: "Recordatorio: reunión de equipo el viernes 18:00 en sala oficina. Repaso de incidencias y planificación semana.", hoursAgo: 48, isRead: false },
];

// ==================== NOTIFICATIONS (8 for instructor) ====================
export interface DemoNotification {
  toEmail: string;
  type: string;
  title: string;
  body: string;
  hoursAgo: number;
  isRead: boolean;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { toEmail: "profesor@demo.skicenter.com", type: "new_assignment", title: "Nueva asignación de clase", body: "Tienes una clase grupo A2 hoy 10:00-13:00 en Baqueira (5 alumnos).", hoursAgo: 0.5, isRead: false },
  { toEmail: "profesor@demo.skicenter.com", type: "schedule_change", title: "Cambio en tu horario", body: "Tu clase de mañana se traslada a las 09:30 (originalmente 10:00).", hoursAgo: 4, isRead: false },
  { toEmail: "profesor@demo.skicenter.com", type: "new_message", title: "Nuevo mensaje de Demo Admin", body: "Recordatorio: reunión de equipo el viernes 18:00.", hoursAgo: 6, isRead: false },
  { toEmail: "profesor@demo.skicenter.com", type: "payroll_ready", title: "Nómina disponible", body: "Tu nómina del mes anterior ya está disponible para descarga.", hoursAgo: 24, isRead: true },
  { toEmail: "profesor@demo.skicenter.com", type: "incident_assigned", title: "Incidencia abierta", body: "Se ha abierto una incidencia en tu grupo de ayer. Revisa el detalle.", hoursAgo: 30, isRead: true },
  { toEmail: "profesor@demo.skicenter.com", type: "checkin_reminder", title: "Recordatorio de fichaje", body: "No olvides fichar la salida antes de irte hoy.", hoursAgo: 48, isRead: true },
  { toEmail: "profesor@demo.skicenter.com", type: "new_assignment", title: "Nueva asignación", body: "Clase particular 1h asignada para mañana 16:00 con cliente VIP.", hoursAgo: 50, isRead: true },
  { toEmail: "profesor@demo.skicenter.com", type: "schedule_change", title: "Día libre aprobado", body: "Tu solicitud de día libre del próximo lunes ha sido aprobada.", hoursAgo: 72, isRead: true },
];

// ==================== ROOM TYPE EXTRA (1 more = 4 total) ====================
export const DEMO_EXTRA_ROOM_TYPE = {
  slug: "individual",
  title: "Habitación Individual",
  capacity: 1,
  basePrice: 80,
  description: "Habitación individual con vistas, ideal para viajeros solos.",
};

// ==================== LODGE STAYS (3) ====================
export interface DemoLodgeStay {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeSlug: string;
  checkInDaysOffset: number;
  checkOutDaysOffset: number;
  adults: number;
  children: number;
  totalAmount: number;
  status: "reservada" | "checkin" | "checkout" | "cancelada";
  notes: string | null;
}

export const DEMO_LODGE_STAYS: DemoLodgeStay[] = [
  { guestName: "Familia Iglesias", guestEmail: "iglesias.fam@gmail.com", guestPhone: "+34 660 111 222", roomTypeSlug: "suite-familiar", checkInDaysOffset: -2, checkOutDaysOffset: 3, adults: 2, children: 2, totalAmount: 1450, status: "checkin", notes: "Llegan con tabla snowboard propia, pidieron taquilla extra." },
  { guestName: "Marcos Iturralde", guestEmail: "marcos.it@outlook.es", guestPhone: "+34 661 222 333", roomTypeSlug: "doble", checkInDaysOffset: 5, checkOutDaysOffset: 8, adults: 2, children: 0, totalAmount: 540, status: "reservada", notes: null },
  { guestName: "Elena Bautista", guestEmail: "elena.bautista@gmail.com", guestPhone: "+34 662 333 444", roomTypeSlug: "suite-junior", checkInDaysOffset: -7, checkOutDaysOffset: -3, adults: 1, children: 0, totalAmount: 720, status: "checkout", notes: "Reseña pendiente — enviar email." },
];

// ==================== INVOICES EXTRA (9 more = 12 total) ====================
export interface DemoInvoice {
  number: string;
  status: "paid" | "sent" | "draft" | "cancelled";
  subtotal: number;
  taxAmount: number;
  total: number;
  issuedDaysAgo: number | null;
  paidDaysAgo: number | null;
  notes: string | null;
  lines: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>;
}

export const DEMO_INVOICES: DemoInvoice[] = [
  { number: "FAC-2026-0001", status: "paid", subtotal: 413.22, taxAmount: 86.78, total: 500, issuedDaysAgo: 45, paidDaysAgo: 40, notes: null,
    lines: [{ description: "Alquiler equipo esquí adulto — 5 días", quantity: 2, unitPrice: 180, lineTotal: 360 }, { description: "Seguro daños equipo", quantity: 2, unitPrice: 26.61, lineTotal: 53.22 }] },
  { number: "FAC-2026-0002", status: "paid", subtotal: 991.74, taxAmount: 208.26, total: 1200, issuedDaysAgo: 30, paidDaysAgo: 25, notes: "Familia López — 2 adultos, 2 niños",
    lines: [{ description: "Pack Aventura Familiar (4 pax)", quantity: 1, unitPrice: 991.74, lineTotal: 991.74 }] },
  { number: "FAC-2026-0003", status: "paid", subtotal: 264.46, taxAmount: 55.54, total: 320, issuedDaysAgo: 22, paidDaysAgo: 20, notes: null,
    lines: [{ description: "Forfait Sierra Nevada 3 días x 2", quantity: 2, unitPrice: 132.23, lineTotal: 264.46 }] },
  { number: "FAC-2026-0004", status: "paid", subtotal: 661.16, taxAmount: 138.84, total: 800, issuedDaysAgo: 3, paidDaysAgo: 1, notes: "Grupo amigos — 4 pax",
    lines: [{ description: "Cursillo grupo + alquiler equipo (4 pax)", quantity: 4, unitPrice: 165.29, lineTotal: 661.16 }] },
  { number: "FAC-2026-0005", status: "paid", subtotal: 132.23, taxAmount: 27.77, total: 160, issuedDaysAgo: 1, paidDaysAgo: 0, notes: null,
    lines: [{ description: "Masaje Relajante 60 min", quantity: 2, unitPrice: 66.12, lineTotal: 132.23 }] },
  { number: "FAC-2026-0006", status: "sent", subtotal: 1735.54, taxAmount: 364.46, total: 2100, issuedDaysAgo: 8, paidDaysAgo: null, notes: "Familia Pérez — pack semana premium Grandvalira",
    lines: [{ description: "Pack premium familia 5 días", quantity: 1, unitPrice: 1735.54, lineTotal: 1735.54 }] },
  { number: "FAC-2026-0007", status: "sent", subtotal: 727.27, taxAmount: 152.73, total: 880, issuedDaysAgo: 6, paidDaysAgo: null, notes: "Pendiente pago — vencimiento próxima semana",
    lines: [{ description: "Estancia hotel 3 noches", quantity: 3, unitPrice: 220, lineTotal: 660 }, { description: "Suplemento spa", quantity: 1, unitPrice: 67.27, lineTotal: 67.27 }] },
  { number: "FAC-2026-0008", status: "sent", subtotal: 297.52, taxAmount: 62.48, total: 360, issuedDaysAgo: 4, paidDaysAgo: null, notes: null,
    lines: [{ description: "SnowCamp infantil — día completo", quantity: 1, unitPrice: 297.52, lineTotal: 297.52 }] },
  { number: "FAC-2026-0009", status: "sent", subtotal: 1487.60, taxAmount: 312.40, total: 1800, issuedDaysAgo: 3, paidDaysAgo: null, notes: "Empresa team-building",
    lines: [{ description: "Pack empresa 6 pax — 2 días", quantity: 1, unitPrice: 1487.60, lineTotal: 1487.60 }] },
  { number: "FAC-2026-0010", status: "draft", subtotal: 132.23, taxAmount: 27.77, total: 160, issuedDaysAgo: null, paidDaysAgo: null, notes: "Borrador — pendiente revisión",
    lines: [{ description: "Clase particular 2h", quantity: 1, unitPrice: 132.23, lineTotal: 132.23 }] },
  { number: "FAC-2026-0011", status: "draft", subtotal: 198.35, taxAmount: 41.65, total: 240, issuedDaysAgo: null, paidDaysAgo: null, notes: null,
    lines: [{ description: "Restaurante grupo 8 pax", quantity: 1, unitPrice: 198.35, lineTotal: 198.35 }] },
  { number: "FAC-2026-0012", status: "cancelled", subtotal: 413.22, taxAmount: 86.78, total: 500, issuedDaysAgo: 12, paidDaysAgo: null, notes: "Anulada — cliente canceló por enfermedad",
    lines: [{ description: "Pack pareja 2 días", quantity: 1, unitPrice: 413.22, lineTotal: 413.22 }] },
];

// ==================== EXPENSES (10) ====================
export interface DemoExpense {
  concept: string;
  amount: number;
  categoryCode: string; // PER | SUM | MKT
  costCenterCode: string | null; // OP | ADM
  status: "pending" | "justified" | "accounted";
  paymentMethod: "cash" | "card" | "transfer" | "direct_debit";
  daysAgo: number;
}

export const DEMO_EXPENSES: DemoExpense[] = [
  { concept: "Electricidad — abril", amount: 480, categoryCode: "SUM", costCenterCode: "OP", status: "accounted", paymentMethod: "direct_debit", daysAgo: 1 },
  { concept: "Nóminas — abril", amount: 14500, categoryCode: "PER", costCenterCode: "ADM", status: "justified", paymentMethod: "transfer", daysAgo: 1 },
  { concept: "Campaña Google Ads", amount: 950, categoryCode: "MKT", costCenterCode: null, status: "pending", paymentMethod: "card", daysAgo: 4 },
  { concept: "Material oficina (papelería)", amount: 87.50, categoryCode: "SUM", costCenterCode: "ADM", status: "accounted", paymentMethod: "card", daysAgo: 7 },
  { concept: "Mantenimiento esquís — taller", amount: 320, categoryCode: "SUM", costCenterCode: "OP", status: "justified", paymentMethod: "transfer", daysAgo: 9 },
  { concept: "Patrocinio carrera local", amount: 600, categoryCode: "MKT", costCenterCode: null, status: "accounted", paymentMethod: "transfer", daysAgo: 12 },
  { concept: "Combustible furgonetas", amount: 245, categoryCode: "SUM", costCenterCode: "OP", status: "pending", paymentMethod: "card", daysAgo: 14 },
  { concept: "Bonus equipo monitores Q1", amount: 2400, categoryCode: "PER", costCenterCode: "ADM", status: "justified", paymentMethod: "transfer", daysAgo: 18 },
  { concept: "Diseño gráfico web (freelance)", amount: 750, categoryCode: "MKT", costCenterCode: null, status: "accounted", paymentMethod: "transfer", daysAgo: 22 },
  { concept: "Seguro RC profesional anual", amount: 1850, categoryCode: "SUM", costCenterCode: "ADM", status: "accounted", paymentMethod: "transfer", daysAgo: 28 },
];

// ==================== SUPPLIERS (3) WITH SETTLEMENTS ====================
export interface DemoSupplier {
  fiscalName: string;
  commercialName: string;
  nif: string;
  iban: string;
  email: string;
  phone: string;
  commissionPercentage: number;
  paymentMethod: "transfer" | "card";
  settlementFrequency: "biweekly" | "monthly" | "quarterly";
  status: "active" | "inactive";
  settlement: {
    number: string;
    startDaysAgo: number;
    endDaysAgo: number;
    status: "draft" | "sent" | "paid";
    sentDaysAgo: number | null;
    paidDaysAgo: number | null;
    lines: Array<{ serviceType: string; serviceDate_daysAgo: number; paxCount: number; saleAmount: number }>;
  };
}

export const DEMO_SUPPLIERS: DemoSupplier[] = [
  {
    fiscalName: "Aventura Total S.L.", commercialName: "Aventura Total", nif: "B12345678",
    iban: "ES91 2100 0418 4502 0005 1332", email: "admin@aventuratotal.es", phone: "+34 974 123 456",
    commissionPercentage: 15, paymentMethod: "transfer", settlementFrequency: "monthly", status: "active",
    settlement: {
      number: "LIQ-2026-0001", startDaysAgo: 60, endDaysAgo: 30, status: "paid", sentDaysAgo: 28, paidDaysAgo: 20,
      lines: [
        { serviceType: "activity", serviceDate_daysAgo: 55, paxCount: 4, saleAmount: 480 },
        { serviceType: "activity", serviceDate_daysAgo: 48, paxCount: 2, saleAmount: 220 },
        { serviceType: "activity", serviceDate_daysAgo: 35, paxCount: 6, saleAmount: 720 },
      ],
    },
  },
  {
    fiscalName: "Sierra Nevada Sports S.L.", commercialName: "SN Sports", nif: "B87654321",
    iban: "ES23 0049 1500 5028 1011 1099", email: "contacto@snsports.es", phone: "+34 958 654 321",
    commissionPercentage: 10, paymentMethod: "transfer", settlementFrequency: "monthly", status: "active",
    settlement: {
      number: "LIQ-2026-0002", startDaysAgo: 30, endDaysAgo: 1, status: "sent", sentDaysAgo: 1, paidDaysAgo: null,
      lines: [
        { serviceType: "hotel", serviceDate_daysAgo: 25, paxCount: 4, saleAmount: 880 },
        { serviceType: "hotel", serviceDate_daysAgo: 18, paxCount: 2, saleAmount: 440 },
        { serviceType: "spa", serviceDate_daysAgo: 12, paxCount: 2, saleAmount: 132 },
      ],
    },
  },
  {
    fiscalName: "Pirineos Montaña S.A.", commercialName: "Pirineos Mountain", nif: "A45678912",
    iban: "ES80 0081 0298 6300 0103 5678", email: "info@pirineosmtn.es", phone: "+34 974 555 444",
    commissionPercentage: 12, paymentMethod: "transfer", settlementFrequency: "biweekly", status: "active",
    settlement: {
      number: "LIQ-2026-0003", startDaysAgo: 14, endDaysAgo: 0, status: "draft", sentDaysAgo: null, paidDaysAgo: null,
      lines: [
        { serviceType: "activity", serviceDate_daysAgo: 10, paxCount: 8, saleAmount: 1200 },
        { serviceType: "restaurant", serviceDate_daysAgo: 6, paxCount: 6, saleAmount: 320 },
      ],
    },
  },
];

// ==================== REVIEWS (10) ====================
export interface DemoReview {
  entityType: "experience" | "hotel" | "spa" | "restaurant";
  entityId: string;
  rating: number;
  authorName: string;
  authorEmail: string;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  reply: string | null;
  stayDaysAgo: number;
}

export const DEMO_REVIEWS: DemoReview[] = [
  { entityType: "experience", entityId: "baqueira-esqui", rating: 5, authorName: "Laura Fernández", authorEmail: "laura.f@email.com", title: "Increíble experiencia", body: "Las pistas estaban en perfecto estado y el equipo de alquiler era de gran calidad. Repetiremos seguro.", status: "approved", reply: "¡Muchas gracias Laura! Os esperamos pronto en Skicenter.", stayDaysAgo: 75 },
  { entityType: "hotel", entityId: "suite-familiar", rating: 4, authorName: "Miguel Ángel Ruiz", authorEmail: "miguel.r@email.com", title: "Muy buena relación calidad-precio", body: "La suite familiar era espaciosa y limpia. El desayuno buffet excelente. Solo faltaba un poco más de presión en la ducha.", status: "approved", reply: "Gracias Miguel, tomamos nota del tema de la ducha — ya estamos en ello.", stayDaysAgo: 60 },
  { entityType: "spa", entityId: "masaje-deportivo", rating: 3, authorName: "Ana Belén Torres", authorEmail: "anabelen@email.com", title: "Correcto pero mejorable", body: "El masaje estuvo bien pero la sala estaba un poco fría. El terapeuta fue amable.", status: "pending", reply: null, stayDaysAgo: 40 },
  { entityType: "restaurant", entityId: "el-mirador", rating: 1, authorName: "Pedro García", authorEmail: "pedro.g@email.com", title: "Muy decepcionante", body: "Esperamos 45 minutos para que nos sirvieran y la comida llegó fría.", status: "rejected", reply: null, stayDaysAgo: 50 },
  { entityType: "experience", entityId: "snowcamp-full-day", rating: 5, authorName: "Lucía Mendoza", authorEmail: "lucia.m@email.com", title: "Mis hijos lo adoraron", body: "Los monitores son maravillosos con los niños. Volveremos seguro.", status: "approved", reply: null, stayDaysAgo: 30 },
  { entityType: "hotel", entityId: "doble", rating: 5, authorName: "Roberto Cánovas", authorEmail: "roberto.c@email.com", title: "Perfecto fin de semana", body: "Habitación impecable y desayuno espectacular. La ubicación es ideal para acceder a las pistas.", status: "approved", reply: "¡Muchas gracias Roberto!", stayDaysAgo: 18 },
  { entityType: "spa", entityId: "facial-hidratante", rating: 4, authorName: "Carmen Díez", authorEmail: "carmen.d@email.com", title: "Muy relajante", body: "La esteticista fue muy profesional. Repetiría seguro. Algo de espera al inicio.", status: "approved", reply: null, stayDaysAgo: 22 },
  { entityType: "restaurant", entityId: "el-mirador", rating: 5, authorName: "Sergio Vidal", authorEmail: "sergio.v@email.com", title: "Comida deliciosa con vistas", body: "Probamos el menú degustación, todo de 10. La carta de vinos local es excelente.", status: "approved", reply: "¡Gracias Sergio! Esperamos volver a veros pronto.", stayDaysAgo: 15 },
  { entityType: "experience", entityId: "clase-esqui-grupo", rating: 4, authorName: "Inés Pardo", authorEmail: "ines.p@email.com", title: "Buena clase", body: "Profesor paciente con principiantes. El grupo estaba bien dimensionado.", status: "approved", reply: null, stayDaysAgo: 9 },
  { entityType: "experience", entityId: "alquiler-esqui-adulto-media", rating: 2, authorName: "Andrés Hidalgo", authorEmail: "andres.h@email.com", title: "Equipo desgastado", body: "Los esquís que me dieron tenían mucho uso. Las botas no encajaban bien.", status: "pending", reply: null, stayDaysAgo: 5 },
];

// ==================== TPV CASH SESSION + SALES (1 session, 5 sales) ====================
export interface DemoTpvSale {
  ticketNumber: string;
  hoursAgoFromOpen: number;
  totalAmount: number;
  totalTax: number;
  cash: number;
  card: number;
  bizum: number;
  items: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number; taxPerLine: number }>;
}

export const DEMO_TPV_SESSION = {
  registerName: "Caja Principal",
  registerLocation: "Recepción Baqueira",
  openingAmount: 200,
  openedHoursAgo: 8,
  openedByEmail: "manager@demo.skicenter.com",
};

export const DEMO_TPV_SALES: DemoTpvSale[] = [
  { ticketNumber: "TKT-2026-0001", hoursAgoFromOpen: -7.5, totalAmount: 56, totalTax: 9.72, cash: 56, card: 0, bizum: 0,
    items: [{ description: "Alquiler equipo esquí adulto 1 día", quantity: 1, unitPrice: 56, lineTotal: 56, taxPerLine: 9.72 }] },
  { ticketNumber: "TKT-2026-0002", hoursAgoFromOpen: -6, totalAmount: 240, totalTax: 41.65, cash: 0, card: 240, bizum: 0,
    items: [{ description: "Pack equipo familia (4 pax)", quantity: 4, unitPrice: 60, lineTotal: 240, taxPerLine: 41.65 }] },
  { ticketNumber: "TKT-2026-0003", hoursAgoFromOpen: -4.5, totalAmount: 28, totalTax: 4.86, cash: 28, card: 0, bizum: 0,
    items: [{ description: "Menú montaña", quantity: 1, unitPrice: 28, lineTotal: 28, taxPerLine: 4.86 }] },
  { ticketNumber: "TKT-2026-0004", hoursAgoFromOpen: -3, totalAmount: 145, totalTax: 25.17, cash: 0, card: 0, bizum: 145,
    items: [{ description: "Clase particular 2h x 2 pax", quantity: 2, unitPrice: 72.5, lineTotal: 145, taxPerLine: 25.17 }] },
  { ticketNumber: "TKT-2026-0005", hoursAgoFromOpen: -1, totalAmount: 95, totalTax: 16.49, cash: 0, card: 95, bizum: 0,
    items: [{ description: "Forfait + locker día", quantity: 1, unitPrice: 95, lineTotal: 95, taxPerLine: 16.49 }] },
];
