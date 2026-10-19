import { DashboardBoardItem } from './mockDashboardBoards';

const LOCAL_PROJECTS_KEY = 'taskflow.localProjects';

export interface LocalProject {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'team';
  createdAt: string;
}

interface CreateLocalProjectInput {
  name: string;
  description: string;
  visibility: 'private' | 'team';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getLocalProjects(): LocalProject[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const serialized = window.localStorage.getItem(LOCAL_PROJECTS_KEY);

    if (!serialized) {
      return [];
    }

    const parsed = JSON.parse(serialized) as LocalProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(projects: LocalProject[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
}

export function createLocalProject(input: CreateLocalProjectInput): LocalProject {
  const baseSlug = slugify(input.name) || 'nuevo-proyecto';
  const shortId = Date.now().toString(36);

  const project: LocalProject = {
    id: `${baseSlug}-${shortId}`,
    name: input.name.trim(),
    description: input.description.trim(),
    visibility: input.visibility,
    createdAt: new Date().toISOString(),
  };

  const existingProjects = getLocalProjects();
  saveLocalProjects([project, ...existingProjects]);

  return project;
}

export function mapLocalProjectToBoardCard(project: LocalProject): DashboardBoardItem {
  return {
    title: project.name,
    updatedText: 'Creado en este navegador',
    label: project.visibility === 'team' ? 'Equipo' : 'Privado',
    href: `/boards/${project.id}`,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMU7om3wSC3rCwPhEzdMSvUN67BcI-DpEA4Vwiu-Nfbp9h8-1kEZhBRKuHtZEqslf0GuBkEZWHO7B9Mcsc0-13suMNCqMsG6DmbSHHeW_2rVIc8SdWWueKT0-6AKPmjhXdqA9jzgXcLARm5OC97eJu1L75Zoxsux5QWfEepN2phqvIbAK9KD2QxNtj3Au5hEELF2BAtYEFiz5IF39gUoJNTc_LXNaLUBgLhzt70MQmI5BvbBU8pJGxBA',
    avatars: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5eloJj6fMhjoDR_4SDQIuM11CDWBH6d5uo6huj9uhurGqgA_mrdynC_20MgMAYuJVyc_cVEudoy99yTaLzf3VTv0QwcXXVrgC6RFyV4jrX7SHcQS3y3dX5hHTZ1gj5XROzf7732hqqmxYmM1WzNSqAa42l6GyiSltLZSrppD6w2BsyDiL010V0stVvmTj0f9FolhmUY5L9C7wXyzV_u0yXqq1XOGxnuL4LswHgkxhMEp9cxXkTPJNjQ',
        alt: 'Proyecto local',
      },
    ],
    progressPercent: 10,
    labelClassName: 'bg-primary text-white',
    progressClassName: 'bg-primary',
  };
}
