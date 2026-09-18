const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

const ABBREVIATIONS = new Map([
  ['Методы и технологии управления ИТ-проектами', 'МиТУИП'],
  ['Аэрокосмические системы и технологии обработки информации', 'АСиТОИ'],
  ['Управление научно-исследовательскими и опытно-конструкторскими работами', 'УНИиОКР'],
  ['Технологии разработки программного обеспечения', 'ТРПО'],
  ['Технологии разработки ПО', 'ТРПО'],
  ['Современная философия и методология науки', 'СФиМН'],
  ['Научно-исследовательская практика', 'НИР практика'],
].map(([fullName, shortName]) => [normalize(fullName), shortName]));

export function getDisciplineDisplayName(name: string): string {
  return ABBREVIATIONS.get(normalize(name)) ?? name;
}
