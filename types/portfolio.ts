export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  link?: string;
  githubUrl?: string;
  techStack: string[];
  featured?: boolean;
  category?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  highlights?: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Skill {
  name: string;
  level?: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface Portfolio {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  about: string;
  bannerUrl?: string;
  skills: string[];
  skillDetails?: Skill[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  socialLinks?: SocialLink[];
  template: 'minimal' | 'modern' | 'creative' | 'professional' | 'dark' | string;
  themeColor?: string;
  achievements?: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
