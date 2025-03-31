import { XMLParser } from "fast-xml-parser";
import { createHash } from 'crypto';
import NodeCache from "node-cache";

export interface HistoricalChange {
  issueDate: Date;
  amendmentDate: Date;
  title: number;
  id: string;
  description: string;
  refUri: string;
}

export interface StatisticsResult {
  wordCount: number;
  changes: HistoricalChange[];
  numberOfTitles?: number;
  checksum: string;
  agency: Agency;
  changesByDate: Map<string, number>;
  regsByTitle: Map<string, number>;
}

export interface CfrRef {
  title: number;
  chapter: string | undefined;
}

export interface Agency {
  name: string;
  slug: string;
  cfrRefs: CfrRef[];
}

export interface HierarchyJson {
  identifier: string;
  label: string;
  label_level: string;
  label_description: string;
  reserved: boolean;
  type: string;
  size: number;
  children: HierarchyJson[]
}

export interface Title {
  number: number;
  name: string;
  latest_amended_on: string;
  latest_issue_date: string;
  up_to_date_as_of: string;
  reserved: boolean;
}

export interface TitleJson {
  titles: Title[];
}

export interface cfr_reference {
  cfr_reference: string;
  hierarchy: {
    title: number,
    chapter?: string,
    part?: string,
    subpart?: string
    section?: string,
  }
}

export interface Correction {
  id: number;
  cfr_references: cfr_reference[];
  corrective_action: string;
  error_corrected: string;
  error_occurred: string;
  fr_citation: string;
  position: number;
  display_in_toc: boolean;
  title: number;
  year: number;
  last_modified: Date;
}

export interface CorrectionsJson {
  ecfr_corrections: Correction[]
}

export interface TitleVersion {
  date: Date;
  amendment_date: Date;
  issue_date: Date;
  identifier: string;
  name: string;
  part: string;
  substantive: boolean;
  removed: boolean;
  subpart?: string;
  title: string;
  type: string;
}

export interface VersionJson {
  content_versions: TitleVersion[];
}

const efcrBaseUrl: string = "https://www.ecfr.gov";
const apiPath: string = "api/versioner/v1"
const xmlPath: string = "full"
const htmlPath: string = "api/renderer/v1/content/enhanced"
const hierarchyPath: string = "structure"
const titlesPath: string = "titles"

// Simple in memory cache
const cache = new NodeCache();

async function get<T>(path: string): Promise<T> {
  const uri = `${efcrBaseUrl}/${path}`;

  const json = cache.get<T>(uri);

  if (!!json) {
    console.log(`cache hit`)
    return json;
  }

  console.log(`Requesting ${uri}`)
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const j = await response.json() as T;
  cache.set<T>(uri, j);
  return j;
}

async function getXml(path: string): Promise<string> {
  const uri = `${efcrBaseUrl}/${path}`;

  const text = cache.get(uri) as string;
  if (!!text) {
    console.log(`cache hit`)
    return text;
  }

  console.log(`Requesting ${uri}`)
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const t = await response.text();
  cache.set(uri, t);
  return t;
}

function iterateObjectRecursively(obj: any, callback: any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      callback(key, obj[key]);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        iterateObjectRecursively(obj[key], callback);
      }
    }
  }
}

// const data = await fetch('https://www.ecfr.gov/api/admin/v1/agencies.json')
// const posts = await data.json()
// const options = posts.agencies.map((agency: any) => (agency.name));3

export function calculateMD5(str: string): string {
  return createHash('md5').update(str).digest('hex');
}

export async function getVersions(title: number): Promise<HistoricalChange[]> {
  const changes: HistoricalChange[] = [];
  try {
    const uri = `${apiPath}/versions/title-${title}.json`;

    const versionJson = await get<VersionJson>(`${uri}`);

    for (let i = 0; i < versionJson.content_versions.length; ++i) {
      const version = versionJson.content_versions[i];

      if (!version.substantive) {
        continue;
      }
      const part = version.part;
      const partQueryString = !!part ? `?part=${part}` : ""

      let subpartQueryString = ""
      if (!!part) {
        const subpart = version.subpart;
        subpartQueryString = !!subpart ? `&subpart=${subpart}` : ""
      }

      changes.push({
        id: version.identifier,
        title: title,
        issueDate: new Date(version.issue_date),
        amendmentDate: new Date(version.amendment_date),
        description: version.name,
        refUri: `${efcrBaseUrl}/${htmlPath}/${version.amendment_date}/title-${title}${partQueryString}${subpartQueryString}`
      });
    }
  } catch (err) {
    console.log(err);
  }

  return changes;
}


function findChapter(hierarchyJson: HierarchyJson, chapter: string): HierarchyJson | null {
  let found = null;
  if (hierarchyJson != null) {
    if (hierarchyJson.type === "chapter" && hierarchyJson.identifier === chapter) {
      found = hierarchyJson;
    } else if (hierarchyJson.children && hierarchyJson.children.length > 0) {
      for (let i = 0; i < hierarchyJson.children.length; ++i) {
        const nestedFound = findChapter(hierarchyJson.children[i], chapter);
        if (nestedFound) {
          found = nestedFound;
        }
      }
    }
  }
  return found;
}

export async function getAgencyStats(agency: Agency): Promise<StatisticsResult> {
  const titleJson = await get<TitleJson>(`${apiPath}/${titlesPath}`);

  const parser = new XMLParser();

  const statistics: StatisticsResult = {
    wordCount: 0,
    changes: [],
    checksum: "",
    agency: agency,
    changesByDate: new Map<string, number>(),
    regsByTitle: new Map<string, number>(),
  };

  let words = "";
  let historicalChanges: HistoricalChange[] = [];
  for (let i = 0; i < agency.cfrRefs.length; ++i) {
    const ref = agency.cfrRefs[i];

    console.log(`Filtering titles by title ${ref.title}, chapter: ${ref.chapter}`)

    const title = titleJson.titles.filter((t) => t.number === ref.title)[0];
    const mostRecentTitleDate = title.up_to_date_as_of;

    const key = title.name;
    statistics.regsByTitle.set(key, (statistics.regsByTitle.get(key) ?? 0) + 1);

    const hierarchyJson = await get<HierarchyJson>(`${apiPath}/${hierarchyPath}/${mostRecentTitleDate}/title-${ref.title}.json`);

    if (ref.chapter) {
      const chapter = findChapter(hierarchyJson, ref.chapter);
      if (!chapter) {
        continue;
      }

      const chapterParts = chapter.children.filter((c) => !c.reserved && c.type == "part").map((c) => c.identifier)
      if (!chapterParts || chapterParts.length == 0) {
        // get subchapter parts
        const subchapters = chapter.children.filter((c) => c.type === "subchapter");
        for (let x = 0; x < subchapters.length; ++x) {
          chapterParts.concat(subchapters.filter((c) => !c.reserved && c.type == "part").map((c) => c.identifier))
        }
      }

      console.log(`Parts: ${chapterParts}`);

      for (let j = 0; j < chapterParts.length; ++j) {
        const part = chapterParts[j];
        const xmlData = await getXml(`${apiPath}/${xmlPath}/${mostRecentTitleDate}/title-${ref.title}.xml?part=${part}`);

        // download xml for each part and perform calculations
        const parsedFcrData = parser.parse(xmlData);

        // Get all the words in the <P> tags in the xml.
        iterateObjectRecursively(parsedFcrData, (key: string, value: any) => {
          if (key == "P") {
            if (Array.isArray(value)) {
              for (let i = 0; i < value.length; ++i) {
                const s = value[i];
                if (typeof s === "object") {
                  words += s["#text"];
                } else {
                  words += s;
                }
              }
            } else if (typeof value === "object") {
              words += value["#text"];
            } else {
              words += value;
            }
          }
        });
      }
    }

    const versions = await getVersions(ref.title);
    historicalChanges = historicalChanges.concat(versions);
  }

  statistics.checksum = calculateMD5(words);
  statistics.wordCount += words.trim().split(" ").length;
  statistics.changes = statistics.changes.concat(historicalChanges);

  for (let i = 0; i < statistics.changes.length; ++i) {
    const change = statistics.changes[i];
    const key = change.amendmentDate.toISOString().split("T")[0];
    statistics.changesByDate.set(key, (statistics.changesByDate.get(key) ?? 0) + 1);
  }
  
  console.log(`checksum: ${statistics.checksum}`);
  console.log(`wordCount: ${statistics.wordCount}`);
  
  return statistics;
}
