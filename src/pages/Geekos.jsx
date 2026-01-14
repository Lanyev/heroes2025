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
import { GeekoCardModal } from '../components/geekos/GeekoCardModal'
import { buildGeekoCards, RARITIES } from '../utils/geekoCards'

// Import TCG styles
import '../styles/tcg-cards.css'

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
  const [selectedCard, setSelectedCard] = useState(null)
  const shouldReduceMotion = useReducedMotion()
  
  // Build card data from rows
  const allCards = useMemo(() => buildGeekoCards(rows), [rows])

  // Handlers para el modal
  const handleCardClick = (card) => {
    setSelectedCard(card)
  }

  const handleCloseModal = () => {
    setSelectedCard(null)
  }
  
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
        
        {/* Cards Grid */}
        {allCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🃏</div>
            <p className="text-slate-400">
              No hay cartas disponibles
            </p>
          </div>
        ) : (
          <motion.div 
            className="tcg-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {allCards.map((card, index) => (
              <motion.div
                key={card.id}
                variants={cardVariants}
              >
                <GeekoTCGCard 
                  card={card} 
                  index={index} 
                  onClick={handleCardClick}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Modal para mostrar card en modo focus */}
        <GeekoCardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={handleCloseModal}
        />
        
        {/* Footer info */}
        <div className="text-center mt-12 py-8 border-t border-slate-700/50">
          <p className="text-slate-600 text-xs">
            Efectos inspirados en Pokémon TCG • Alan Awards 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default Geekos
