import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Heart, Shield, Brain, Zap } from 'lucide-react';

// AI人格配置
const AI_PERSONAS = {
  DefaultAssistant: {
    id: 'DefaultAssistant',
    name: '高效机器',
    icon: Zap,
    color: 'bg-gray-500',
    description: '默认助理模式',
    isDefault: true
  },
  LifeAssistant: {
    id: 'LifeAssistant', 
    name: '知心姐姐',
    icon: Heart,
    color: 'bg-pink-500',
    description: '温暖贴心的生活助理'
  },
  MilitaryAssistant: {
    id: 'MilitaryAssistant',
    name: '铁血军官', 
    icon: Shield,
    color: 'bg-red-600',
    description: '严谨高效的军事助理'
  },
  DevelopmentAssistant: {
    id: 'DevelopmentAssistant',
    name: '睿智博士',
    icon: Brain,
    color: 'bg-blue-600', 
    description: '深度思考的发展助理'
  }
};

function AIPersonaSelector({ selectedPersona, onPersonaChange, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentPersona = AI_PERSONAS[selectedPersona] || AI_PERSONAS.DefaultAssistant;
  const CurrentIcon = currentPersona.icon;

  const handlePersonaSelect = (personaId) => {
    onPersonaChange(personaId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 选择按钮 - 紧凑模式适配 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white border border-gray-200 rounded-macos hover:bg-gray-50 transition-colors ${
          compact 
            ? 'px-2 py-1.5 min-w-[100px]' 
            : 'px-3 py-2 min-w-[140px]'
        }`}
      >
        <div className={`rounded-full ${currentPersona.color} flex items-center justify-center ${
          compact ? 'w-4 h-4' : 'w-5 h-5'
        }`}>
          <CurrentIcon size={compact ? 10 : 12} className="text-white" />
        </div>
        <span className={`font-medium text-gray-700 flex-1 text-left ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          {compact ? currentPersona.name.slice(0, 4) : currentPersona.name}
        </span>
        <ChevronDown 
          size={compact ? 12 : 14} 
          className={`text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 下拉菜单 - 向上展开 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-macos shadow-lg z-50"
          >
            <div className="p-2">
              {Object.values(AI_PERSONAS).map((persona) => {
                const PersonaIcon = persona.icon;
                const isSelected = selectedPersona === persona.id;
                
                return (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-macos transition-colors text-left ${
                      isSelected 
                        ? 'bg-macos-blue text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${persona.color} flex items-center justify-center flex-shrink-0`}>
                      <PersonaIcon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {persona.name}
                        {persona.isDefault && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                            isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                          }`}>
                            默认
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isSelected ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {persona.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击外部关闭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default AIPersonaSelector;
export { AI_PERSONAS };