import '../src/loadEnv';
import { PrismaClient } from '@prisma/client';
import { generatePassword, hashPassword } from '../src/services/password';

const prisma = new PrismaClient();

const matches = [
  // === GROEP A ===
  { matchNum: 1, homeTeam: 'Verenigde Staten', awayTeam: 'Bolivia', matchDate: '2026-06-11T18:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'A' },
  { matchNum: 2, homeTeam: 'Uruguay', awayTeam: 'Panama', matchDate: '2026-06-11T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Groepsfase', group: 'A' },
  { matchNum: 3, homeTeam: 'Verenigde Staten', awayTeam: 'Panama', matchDate: '2026-06-16T18:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Groepsfase', group: 'A' },
  { matchNum: 4, homeTeam: 'Uruguay', awayTeam: 'Bolivia', matchDate: '2026-06-16T21:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Groepsfase', group: 'A' },
  { matchNum: 5, homeTeam: 'Bolivia', awayTeam: 'Panama', matchDate: '2026-06-21T18:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Groepsfase', group: 'A' },
  { matchNum: 6, homeTeam: 'Verenigde Staten', awayTeam: 'Uruguay', matchDate: '2026-06-21T18:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'A' },

  // === GROEP B ===
  { matchNum: 7, homeTeam: 'Argentinië', awayTeam: 'Marokko', matchDate: '2026-06-12T18:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Groepsfase', group: 'B' },
  { matchNum: 8, homeTeam: 'Canada', awayTeam: 'Peru', matchDate: '2026-06-12T21:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Groepsfase', group: 'B' },
  { matchNum: 9, homeTeam: 'Argentinië', awayTeam: 'Peru', matchDate: '2026-06-17T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Groepsfase', group: 'B' },
  { matchNum: 10, homeTeam: 'Canada', awayTeam: 'Marokko', matchDate: '2026-06-17T21:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Groepsfase', group: 'B' },
  { matchNum: 11, homeTeam: 'Marokko', awayTeam: 'Peru', matchDate: '2026-06-22T18:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad', round: 'Groepsfase', group: 'B' },
  { matchNum: 12, homeTeam: 'Argentinië', awayTeam: 'Canada', matchDate: '2026-06-22T18:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Groepsfase', group: 'B' },

  // === GROEP C ===
  { matchNum: 13, homeTeam: 'Spanje', awayTeam: 'Servië', matchDate: '2026-06-12T15:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'C' },
  { matchNum: 14, homeTeam: 'Brazilië', awayTeam: 'Japan', matchDate: '2026-06-12T18:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'C' },
  { matchNum: 15, homeTeam: 'Spanje', awayTeam: 'Japan', matchDate: '2026-06-17T15:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Groepsfase', group: 'C' },
  { matchNum: 16, homeTeam: 'Brazilië', awayTeam: 'Servië', matchDate: '2026-06-17T18:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'C' },
  { matchNum: 17, homeTeam: 'Servië', awayTeam: 'Japan', matchDate: '2026-06-22T21:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Groepsfase', group: 'C' },
  { matchNum: 18, homeTeam: 'Spanje', awayTeam: 'Brazilië', matchDate: '2026-06-22T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'C' },

  // === GROEP D ===
  { matchNum: 19, homeTeam: 'Frankrijk', awayTeam: 'Engeland', matchDate: '2026-06-13T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Groepsfase', group: 'D' },
  { matchNum: 20, homeTeam: 'Australië', awayTeam: 'Costa Rica', matchDate: '2026-06-13T21:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Groepsfase', group: 'D' },
  { matchNum: 21, homeTeam: 'Frankrijk', awayTeam: 'Costa Rica', matchDate: '2026-06-18T18:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'D' },
  { matchNum: 22, homeTeam: 'Australië', awayTeam: 'Engeland', matchDate: '2026-06-18T21:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'D' },
  { matchNum: 23, homeTeam: 'Engeland', awayTeam: 'Costa Rica', matchDate: '2026-06-23T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'D' },
  { matchNum: 24, homeTeam: 'Frankrijk', awayTeam: 'Australië', matchDate: '2026-06-23T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Groepsfase', group: 'D' },

  // === GROEP E ===
  { matchNum: 25, homeTeam: 'Mexico', awayTeam: 'Ivoorkust', matchDate: '2026-06-13T12:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad', round: 'Groepsfase', group: 'E' },
  { matchNum: 26, homeTeam: 'Portugal', awayTeam: 'Ecuador', matchDate: '2026-06-13T15:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Groepsfase', group: 'E' },
  { matchNum: 27, homeTeam: 'Mexico', awayTeam: 'Ecuador', matchDate: '2026-06-18T12:00:00Z', stadium: 'Estadio BBVA', city: 'Monterrey', round: 'Groepsfase', group: 'E' },
  { matchNum: 28, homeTeam: 'Portugal', awayTeam: 'Ivoorkust', matchDate: '2026-06-18T15:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Groepsfase', group: 'E' },
  { matchNum: 29, homeTeam: 'Ivoorkust', awayTeam: 'Ecuador', matchDate: '2026-06-23T21:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad', round: 'Groepsfase', group: 'E' },
  { matchNum: 30, homeTeam: 'Mexico', awayTeam: 'Portugal', matchDate: '2026-06-23T21:00:00Z', stadium: 'Estadio BBVA', city: 'Monterrey', round: 'Groepsfase', group: 'E' },

  // === GROEP F ===
  { matchNum: 31, homeTeam: 'Nederland', awayTeam: 'Tunesië', matchDate: '2026-06-14T18:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Groepsfase', group: 'F' },
  { matchNum: 32, homeTeam: 'Japan', awayTeam: 'Zweden', matchDate: '2026-06-14T21:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Groepsfase', group: 'F' },
  { matchNum: 33, homeTeam: 'Nederland', awayTeam: 'Zweden', matchDate: '2026-06-19T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Groepsfase', group: 'F' },
  { matchNum: 34, homeTeam: 'Japan', awayTeam: 'Tunesië', matchDate: '2026-06-19T21:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'F' },
  { matchNum: 35, homeTeam: 'Tunesië', awayTeam: 'Zweden', matchDate: '2026-06-24T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'F' },
  { matchNum: 36, homeTeam: 'Nederland', awayTeam: 'Japan', matchDate: '2026-06-24T18:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Groepsfase', group: 'F' },

  // === GROEP G ===
  { matchNum: 37, homeTeam: 'Duitsland', awayTeam: 'Algerije', matchDate: '2026-06-14T15:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'G' },
  { matchNum: 38, homeTeam: 'Colombia', awayTeam: 'Schotland', matchDate: '2026-06-14T18:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'G' },
  { matchNum: 39, homeTeam: 'Duitsland', awayTeam: 'Schotland', matchDate: '2026-06-19T15:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Groepsfase', group: 'G' },
  { matchNum: 40, homeTeam: 'Colombia', awayTeam: 'Algerije', matchDate: '2026-06-19T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'G' },
  { matchNum: 41, homeTeam: 'Algerije', awayTeam: 'Schotland', matchDate: '2026-06-24T21:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'G' },
  { matchNum: 42, homeTeam: 'Duitsland', awayTeam: 'Colombia', matchDate: '2026-06-24T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'G' },

  // === GROEP H ===
  { matchNum: 43, homeTeam: 'Kroatië', awayTeam: 'Nieuw-Zeeland', matchDate: '2026-06-15T18:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'H' },
  { matchNum: 44, homeTeam: 'Senegal', awayTeam: 'Nigeria', matchDate: '2026-06-15T21:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'H' },
  { matchNum: 45, homeTeam: 'Kroatië', awayTeam: 'Nigeria', matchDate: '2026-06-20T18:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Groepsfase', group: 'H' },
  { matchNum: 46, homeTeam: 'Senegal', awayTeam: 'Nieuw-Zeeland', matchDate: '2026-06-20T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Groepsfase', group: 'H' },
  { matchNum: 47, homeTeam: 'Nieuw-Zeeland', awayTeam: 'Nigeria', matchDate: '2026-06-25T18:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'H' },
  { matchNum: 48, homeTeam: 'Kroatië', awayTeam: 'Senegal', matchDate: '2026-06-25T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'H' },

  // === GROEP I ===
  { matchNum: 49, homeTeam: 'Italië', awayTeam: 'Kenia', matchDate: '2026-06-15T12:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Groepsfase', group: 'I' },
  { matchNum: 50, homeTeam: 'België', awayTeam: 'Paraguay', matchDate: '2026-06-15T15:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Groepsfase', group: 'I' },
  { matchNum: 51, homeTeam: 'Italië', awayTeam: 'Paraguay', matchDate: '2026-06-20T12:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Groepsfase', group: 'I' },
  { matchNum: 52, homeTeam: 'België', awayTeam: 'Kenia', matchDate: '2026-06-20T15:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Groepsfase', group: 'I' },
  { matchNum: 53, homeTeam: 'Kenia', awayTeam: 'Paraguay', matchDate: '2026-06-25T21:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'I' },
  { matchNum: 54, homeTeam: 'Italië', awayTeam: 'België', matchDate: '2026-06-25T21:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Groepsfase', group: 'I' },

  // === GROEP J ===
  { matchNum: 55, homeTeam: 'Zuid-Korea', awayTeam: 'Venezuela', matchDate: '2026-06-11T15:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'J' },
  { matchNum: 56, homeTeam: 'Polen', awayTeam: 'Ghana', matchDate: '2026-06-11T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'J' },
  { matchNum: 57, homeTeam: 'Zuid-Korea', awayTeam: 'Ghana', matchDate: '2026-06-16T15:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'J' },
  { matchNum: 58, homeTeam: 'Polen', awayTeam: 'Venezuela', matchDate: '2026-06-16T18:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Groepsfase', group: 'J' },
  { matchNum: 59, homeTeam: 'Venezuela', awayTeam: 'Ghana', matchDate: '2026-06-21T21:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Groepsfase', group: 'J' },
  { matchNum: 60, homeTeam: 'Zuid-Korea', awayTeam: 'Polen', matchDate: '2026-06-21T21:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Groepsfase', group: 'J' },

  // === GROEP K ===
  { matchNum: 61, homeTeam: 'Zwitserland', awayTeam: 'Curaçao', matchDate: '2026-06-12T12:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Groepsfase', group: 'K' },
  { matchNum: 62, homeTeam: 'Oekraïne', awayTeam: 'Egypte', matchDate: '2026-06-12T15:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Groepsfase', group: 'K' },
  { matchNum: 63, homeTeam: 'Zwitserland', awayTeam: 'Egypte', matchDate: '2026-06-17T12:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Groepsfase', group: 'K' },
  { matchNum: 64, homeTeam: 'Oekraïne', awayTeam: 'Curaçao', matchDate: '2026-06-17T15:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Groepsfase', group: 'K' },
  { matchNum: 65, homeTeam: 'Curaçao', awayTeam: 'Egypte', matchDate: '2026-06-22T12:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Groepsfase', group: 'K' },
  { matchNum: 66, homeTeam: 'Zwitserland', awayTeam: 'Oekraïne', matchDate: '2026-06-22T12:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Groepsfase', group: 'K' },

  // === GROEP L ===
  { matchNum: 67, homeTeam: 'Turkije', awayTeam: 'Honduras', matchDate: '2026-06-13T12:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Groepsfase', group: 'L' },
  { matchNum: 68, homeTeam: 'Tsjechië', awayTeam: 'Kameroen', matchDate: '2026-06-13T15:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'L' },
  { matchNum: 69, homeTeam: 'Turkije', awayTeam: 'Kameroen', matchDate: '2026-06-18T12:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Groepsfase', group: 'L' },
  { matchNum: 70, homeTeam: 'Tsjechië', awayTeam: 'Honduras', matchDate: '2026-06-18T15:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Groepsfase', group: 'L' },
  { matchNum: 71, homeTeam: 'Honduras', awayTeam: 'Kameroen', matchDate: '2026-06-23T12:00:00Z', stadium: 'Estadio BBVA', city: 'Monterrey', round: 'Groepsfase', group: 'L' },
  { matchNum: 72, homeTeam: 'Turkije', awayTeam: 'Tsjechië', matchDate: '2026-06-23T12:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Groepsfase', group: 'L' },

  // === ZESTIENDE FINALES (16 wedstrijden) ===
  { matchNum: 73, homeTeam: 'Winnaar A', awayTeam: 'Nr. 3 C/D', matchDate: '2026-06-28T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Zestiende finale', group: null },
  { matchNum: 74, homeTeam: 'Winnaar B', awayTeam: 'Nr. 3 E/F', matchDate: '2026-06-28T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Zestiende finale', group: null },
  { matchNum: 75, homeTeam: 'Winnaar C', awayTeam: 'Nr. 3 A/B', matchDate: '2026-06-29T18:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Zestiende finale', group: null },
  { matchNum: 76, homeTeam: 'Winnaar D', awayTeam: 'Nr. 3 G/H', matchDate: '2026-06-29T21:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Zestiende finale', group: null },
  { matchNum: 77, homeTeam: 'Winnaar E', awayTeam: 'Nr. 3 I/J', matchDate: '2026-06-30T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Zestiende finale', group: null },
  { matchNum: 78, homeTeam: 'Winnaar F', awayTeam: 'Nr. 3 K/L', matchDate: '2026-06-30T21:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Zestiende finale', group: null },
  { matchNum: 79, homeTeam: 'Winnaar G', awayTeam: 'Nr. 2 H', matchDate: '2026-07-01T18:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Zestiende finale', group: null },
  { matchNum: 80, homeTeam: 'Winnaar H', awayTeam: 'Nr. 2 G', matchDate: '2026-07-01T21:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Zestiende finale', group: null },
  { matchNum: 81, homeTeam: 'Winnaar I', awayTeam: 'Nr. 2 J', matchDate: '2026-07-02T18:00:00Z', stadium: 'Levi\'s Stadium', city: 'San Francisco', round: 'Zestiende finale', group: null },
  { matchNum: 82, homeTeam: 'Winnaar J', awayTeam: 'Nr. 2 I', matchDate: '2026-07-02T21:00:00Z', stadium: 'BC Place', city: 'Vancouver', round: 'Zestiende finale', group: null },
  { matchNum: 83, homeTeam: 'Winnaar K', awayTeam: 'Nr. 2 L', matchDate: '2026-07-03T18:00:00Z', stadium: 'Rose Bowl', city: 'Pasadena', round: 'Zestiende finale', group: null },
  { matchNum: 84, homeTeam: 'Winnaar L', awayTeam: 'Nr. 2 K', matchDate: '2026-07-03T21:00:00Z', stadium: 'BMO Field', city: 'Toronto', round: 'Zestiende finale', group: null },
  { matchNum: 85, homeTeam: 'Nr. 2 A', awayTeam: 'Nr. 2 B', matchDate: '2026-07-04T18:00:00Z', stadium: 'Lumen Field', city: 'Seattle', round: 'Zestiende finale', group: null },
  { matchNum: 86, homeTeam: 'Nr. 2 C', awayTeam: 'Nr. 2 D', matchDate: '2026-07-04T21:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico-Stad', round: 'Zestiende finale', group: null },
  { matchNum: 87, homeTeam: 'Nr. 2 E', awayTeam: 'Nr. 2 F', matchDate: '2026-07-04T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Zestiende finale', group: null },
  { matchNum: 88, homeTeam: 'Nr. 3 Beste', awayTeam: 'Nr. 3 Beste', matchDate: '2026-07-04T21:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Zestiende finale', group: null },

  // === ACHTSTE FINALES (8 wedstrijden) ===
  { matchNum: 89, homeTeam: 'Winnaar W73', awayTeam: 'Winnaar W74', matchDate: '2026-07-05T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Achtste finale', group: null },
  { matchNum: 90, homeTeam: 'Winnaar W75', awayTeam: 'Winnaar W76', matchDate: '2026-07-05T21:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Achtste finale', group: null },
  { matchNum: 91, homeTeam: 'Winnaar W77', awayTeam: 'Winnaar W78', matchDate: '2026-07-06T18:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Achtste finale', group: null },
  { matchNum: 92, homeTeam: 'Winnaar W79', awayTeam: 'Winnaar W80', matchDate: '2026-07-06T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Achtste finale', group: null },
  { matchNum: 93, homeTeam: 'Winnaar W81', awayTeam: 'Winnaar W82', matchDate: '2026-07-07T18:00:00Z', stadium: 'NRG Stadium', city: 'Houston', round: 'Achtste finale', group: null },
  { matchNum: 94, homeTeam: 'Winnaar W83', awayTeam: 'Winnaar W84', matchDate: '2026-07-07T21:00:00Z', stadium: 'Gillette Stadium', city: 'Boston', round: 'Achtste finale', group: null },
  { matchNum: 95, homeTeam: 'Winnaar W85', awayTeam: 'Winnaar W86', matchDate: '2026-07-08T18:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', round: 'Achtste finale', group: null },
  { matchNum: 96, homeTeam: 'Winnaar W87', awayTeam: 'Winnaar W88', matchDate: '2026-07-08T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia', round: 'Achtste finale', group: null },

  // === KWARTFINALES (4 wedstrijden) ===
  { matchNum: 97, homeTeam: 'Winnaar W89', awayTeam: 'Winnaar W90', matchDate: '2026-07-11T18:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Kwartfinale', group: null },
  { matchNum: 98, homeTeam: 'Winnaar W91', awayTeam: 'Winnaar W92', matchDate: '2026-07-11T21:00:00Z', stadium: 'SoFi Stadium', city: 'Los Angeles', round: 'Kwartfinale', group: null },
  { matchNum: 99, homeTeam: 'Winnaar W93', awayTeam: 'Winnaar W94', matchDate: '2026-07-12T18:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Kwartfinale', group: null },
  { matchNum: 100, homeTeam: 'Winnaar W95', awayTeam: 'Winnaar W96', matchDate: '2026-07-12T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Kwartfinale', group: null },

  // === HALVE FINALES (2 wedstrijden) ===
  { matchNum: 101, homeTeam: 'Winnaar W97', awayTeam: 'Winnaar W98', matchDate: '2026-07-15T21:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Halve finale', group: null },
  { matchNum: 102, homeTeam: 'Winnaar W99', awayTeam: 'Winnaar W100', matchDate: '2026-07-16T21:00:00Z', stadium: 'AT&T Stadium', city: 'Dallas', round: 'Halve finale', group: null },

  // === FINALE ===
  { matchNum: 103, homeTeam: 'Verliezer HF1', awayTeam: 'Verliezer HF2', matchDate: '2026-07-18T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami', round: 'Troostfinale', group: null },
  { matchNum: 104, homeTeam: 'Winnaar HF1', awayTeam: 'Winnaar HF2', matchDate: '2026-07-19T21:00:00Z', stadium: 'MetLife Stadium', city: 'New Jersey', round: 'Finale', group: null },
];

async function main() {
  // Idempotent: als de database al gevuld is, niets doen (voorkomt dataverlies bij elke deploy).
  const existing = await prisma.match.count();
  if (existing > 0) {
    console.log(`Database bevat al ${existing} wedstrijden — seed overgeslagen.`);
    return;
  }

  console.log('Seeding database...');

  for (const match of matches) {
    await prisma.match.create({
      data: {
        matchNum: match.matchNum,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: new Date(match.matchDate),
        stadium: match.stadium,
        city: match.city,
        round: match.round,
        group: match.group,
      },
    });
  }

  console.log(`Seeded ${matches.length} matches`);

  const adminPassword = generatePassword('admin');
  const adminHash = await hashPassword(adminPassword);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Beheerder',
      email: 'admin@wkpoule.nl',
      avatar: '👑',
      isAdmin: true,
      passwordHash: adminHash,
    },
  });

  console.log(`Created admin user: ${admin.username}`);
  console.log(`Admin password (eenmalig): ${adminPassword}`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
