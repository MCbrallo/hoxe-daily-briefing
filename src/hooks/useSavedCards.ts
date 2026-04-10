import { useState, useEffect, useCallback } from 'react';
import { BriefingItem } from '@/lib/mockData';

const SAVED_CARDS_KEY = 'hoxe_saved_cards';

export function useSavedCards() {
  const [savedCards, setSavedCards] = useState<BriefingItem[]>([]);

  // Function to load cards safely from localStorage
  const loadCards = useCallback(() => {
    try {
      const data = localStorage.getItem(SAVED_CARDS_KEY);
      if (data) {
        setSavedCards(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to parse saved cards from local storage:', e);
    }
  }, []);

  // Sync state initially and listen to our custom event + storage events
  useEffect(() => {
    loadCards();

    // Listen to changes from other tabs
    window.addEventListener('storage', loadCards);
    // Listen to our custom event (for same-tab sync)
    window.addEventListener('hoxe-saved-cards-updated', loadCards);

    return () => {
      window.removeEventListener('storage', loadCards);
      window.removeEventListener('hoxe-saved-cards-updated', loadCards);
    };
  }, [loadCards]);

  const saveCard = (card: BriefingItem) => {
    try {
      const current = localStorage.getItem(SAVED_CARDS_KEY);
      let parsed = [];
      if (current) parsed = JSON.parse(current);
      
      const exists = parsed.some((item: BriefingItem) => item.id === card.id);
      if (!exists) {
        const updated = [...parsed, card];
        localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(updated));
        setSavedCards(updated);
        window.dispatchEvent(new Event('hoxe-saved-cards-updated'));
      }
    } catch (e) {
      console.error('Failed to save card:', e);
    }
  };

  const removeCard = (id: string) => {
    try {
      const current = localStorage.getItem(SAVED_CARDS_KEY);
      if (current) {
        const parsed = JSON.parse(current);
        const updated = parsed.filter((item: BriefingItem) => item.id !== id);
        localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(updated));
        setSavedCards(updated);
        window.dispatchEvent(new Event('hoxe-saved-cards-updated'));
      }
    } catch (e) {
      console.error('Failed to remove card:', e);
    }
  };

  const toggleCard = (card: BriefingItem) => {
    const isSaved = savedCards.some(item => item.id === card.id);
    if (isSaved) {
      removeCard(card.id);
    } else {
      saveCard(card);
    }
  };

  const isSaved = (id: string) => {
    return savedCards.some(item => item.id === id);
  };

  return { savedCards, toggleCard, isSaved, saveCard, removeCard };
}
