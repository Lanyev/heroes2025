/**
 * Geekos TCG Collection Page
 * 
 * Displays Geeko player cards in Pokemon TCG style with:
 * - Full collection grid
 * - Rarity filtering
 * - Interactive card effects
 */

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SectionShell } from '../app/layout/SectionShell'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { GeekoTCGCard } from '../components/geekos/GeekoTCGCard'
import { buildGeekoCards, RARITIES } from '../utils/geekoCards'

// Import TCG styles
import '../styles/tcg-cards.css'

/**
 * Rarity filter buttons
 */
function RarityFilters({ activeRarity, onRarityChange }) {
  const rarities = [
    { id: 'all', label: 'Todas', icon: '🎴' },
    { id: 'legendary', label: 'Legendary', icon: '🌟', color: '#f472b6' },
    { id: 'epic', label: 'Epic', icon: '💜', color: '#a78bfa' },
    { id: 'rare', label: 'Rare', icon: '⭐', color: '#fbbf24' },
    { id: 'common', label: 'Common', icon: '◆', color: '#94a3b8' }
  ]
  
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {rarities.map((rarity) => (
        <button
          key={rarity.id}
          onClick={() => onRarityChange(rarity.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
            transition-all duration-200 border
            ${activeRarity === rarity.id
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800/60 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
            }
          `}
          style={activeRarity === rarity.id && rarity.color ? {
            backgroundColor: `${rarity.color}20`,
            borderColor: rarity.color,
            color: rarity.color
          } : {}}
        >
          <span>{rarity.icon}</span>
          <span>{rarity.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Collection stats display
 */
function CollectionStats({ cards }) {
  const stats = useMemo(() => {
    const byRarity = {
      legendary: cards.filter(c => c.rarity.id === 'legendary').length,
      epic: cards.filter(c => c.rarity.id === 'epic').length,
      rare: cards.filter(c => c.rarity.id === 'rare').length,
      common: cards.filter(c => c.rarity.id === 'common').length
    }
    
    const byArchetype = {
      damage: cards.filter(c => c.archetype.id === 'damage').length,
      carry: cards.filter(c => c.archetype.id === 'carry').length,
      tank: cards.filter(c => c.archetype.id === 'tank').length,
      support: cards.filter(c => c.archetype.id === 'support').length,
      macro: cards.filter(c => c.archetype.id === 'macro').length
    }
    
    return { byRarity, byArchetype, total: cards.length }
  }, [cards])
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 max-w-3xl mx-auto">
      {/* Rarity counts */}
      <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-3 border border-pink-500/30 text-center">
        <div className="text-2xl font-bold text-pink-400">{stats.byRarity.legendary}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Legendary</div>
      </div>
      <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl p-3 border border-violet-500/30 text-center">
        <div className="text-2xl font-bold text-violet-400">{stats.byRarity.epic}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Epic</div>
      </div>
      <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl p-3 border border-amber-500/30 text-center">
        <div className="text-2xl font-bold text-amber-400">{stats.byRarity.rare}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Rare</div>
      </div>
      <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-xl p-3 border border-slate-500/30 text-center">
        <div className="text-2xl font-bold text-slate-400">{stats.byRarity.common}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Common</div>
      </div>
      <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl p-3 border border-indigo-500/30 text-center">
        <div className="text-2xl font-bold text-indigo-400">{stats.total}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">Total</div>
      </div>
    </div>
  )
}

/**
 * Page header with title and description
 */
function PageHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-3 mb-4">
        <span className="text-4xl">🎴</span>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          Geekos TCG Collection
        </h1>
        <span className="text-4xl">✨</span>
      </div>
      <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
        Colección exclusiva de cartas de los jugadores Geekos. Cada carta refleja el estilo de juego
        y estadísticas reales. Pasa el mouse sobre las cartas para ver los efectos holográficos.
      </p>
    </div>
  )
}

/**
 * Main Geekos Page Component
 */
export function Geekos({ rows }) {
  const [activeRarity, setActiveRarity] = useState('all')
  const shouldReduceMotion = useReducedMotion()
  
  // Build card data from rows
  const allCards = useMemo(() => buildGeekoCards(rows), [rows])
  
  // Filter cards by rarity
  const filteredCards = useMemo(() => {
    if (activeRarity === 'all') return allCards
    return allCards.filter(card => card.rarity.id === activeRarity)
  }, [allCards, activeRarity])
  
  // Empty state if no data
  if (rows.length === 0) {
    return <EmptyState message="No hay datos para generar las cartas" />
  }
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1
      }
    }
  }
  
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: 'easeOut'
      }
    }
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <PageHeader />
        
        {/* Collection Stats */}
        <CollectionStats cards={allCards} />
        
        {/* Rarity Filters */}
        <RarityFilters 
          activeRarity={activeRarity} 
          onRarityChange={setActiveRarity} 
        />
        
        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🃏</div>
            <p className="text-slate-400">
              No hay cartas con esta rareza
            </p>
          </div>
        ) : (
          <motion.div 
            className="tcg-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={activeRarity} // Re-animate on filter change
          >
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                variants={cardVariants}
              >
                <GeekoTCGCard card={card} index={index} />
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Footer info */}
        <div className="text-center mt-12 py-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">
            🎮 Cartas generadas automáticamente basadas en estadísticas reales de Heroes of the Storm
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Efectos inspirados en Pokémon TCG • Geekos Community 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default Geekos
