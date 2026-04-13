// src/components/ProjectCard.tsx
import React from 'react';

interface ProjectProps {
  title: string;
  description: string;
  link: string;
  tags?: string[];
}

export default function ProjectCard({ title, description, link, tags = [] }: ProjectProps) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {tag}
          </span>
        ))}
      </div>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-slate-300 hover:text-white underline decoration-blue-500/50 underline-offset-4"
      >
        查看專案 →
      </a>
    </div>
  );
}
