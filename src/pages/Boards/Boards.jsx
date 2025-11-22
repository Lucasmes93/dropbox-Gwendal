import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { BoardModal } from '../../components/BoardModal/BoardModal';
import { CardModal } from '../../components/CardModal/CardModal';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Boards.scss';

export const Boards = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardModalColumnId, setCardModalColumnId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();

    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeBoardCreated = onWebSocketEvent('board_created', () => {
      loadBoards();
    });
    const unsubscribeBoardUpdated = onWebSocketEvent('board_updated', () => {
      loadBoards();
    });
    const unsubscribeBoardDeleted = onWebSocketEvent('board_deleted', () => {
      loadBoards();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadBoards, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeBoardCreated();
      unsubscribeBoardUpdated();
      unsubscribeBoardDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const loadedBoards = await api.getBoards();
      setBoards(loadedBoards);
      if (loadedBoards.length > 0 && !selectedBoard) {
        setSelectedBoard(loadedBoards[0]);
      } else if (selectedBoard) {
        const updatedBoard = loadedBoards.find(b => b.id === selectedBoard.id);
        if (updatedBoard) {
          setSelectedBoard(updatedBoard);
        } else if (loadedBoards.length > 0) {
          setSelectedBoard(loadedBoards[0]);
        } else {
          setSelectedBoard(null);
        }
      }
    } catch (error) {
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const newBoard = await api.createBoard({
        nom: 'Nouveau tableau',
      });
      await loadBoards();
      setSelectedBoard(newBoard);
    } catch (error) {
      alert('Erreur lors de la création: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleSaveBoard = async (board) => {
    try {
      await api.updateBoard(board.id, {
        nom: board.nom,
        colonnes: board.colonnes,
      });
      await loadBoards();
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleAddCard = (columnId, boardId) => {
    setCardModalColumnId(columnId);
    setSelectedCard(null);
    setCardModalOpen(true);
  };

  const handleEditCard = (card, columnId) => {
    setSelectedCard(card);
    setCardModalColumnId(columnId);
    setCardModalOpen(true);
  };

  const handleSaveCard = async (cardData, columnId) => {
    if (!selectedBoard) return;
    const board = boards.find(b => b.id === selectedBoard.id);
    if (!board) return;

    if (selectedCard) {
      // Modifier une carte existante
      const updatedColumns = board.colonnes.map(col => {
        // Retirer la carte de sa colonne actuelle
        if (col.cartes.some(c => c.id === selectedCard.id)) {
          return { ...col, cartes: col.cartes.filter(c => c.id !== selectedCard.id) };
        }
        // Ajouter la carte à la nouvelle colonne si elle a changé
        if (col.id === columnId && !col.cartes.some(c => c.id === cardData.id)) {
          return { ...col, cartes: [...col.cartes, cardData] };
        }
        return col;
      });

      // Si la colonne a changé, s'assurer que la carte est bien dans la nouvelle colonne
      const targetColumn = updatedColumns.find(col => col.id === columnId);
      if (targetColumn && !targetColumn.cartes.some(c => c.id === cardData.id)) {
        targetColumn.cartes.push(cardData);
      }

      await handleSaveBoard({ ...board, colonnes: updatedColumns });
    } else {
      // Créer une nouvelle carte
      const updated = board.colonnes.map(col =>
        col.id === columnId
          ? { ...col, cartes: [...col.cartes, { ...cardData, ordre: col.cartes.length }] }
          : col
      );

      await handleSaveBoard({ ...board, colonnes: updated });
    }
  };

  const handleDeleteCard = async () => {
    if (!selectedCard || !selectedBoard) return;
    
    try {
      const board = boards.find(b => b.id === selectedBoard.id);
      if (!board) return;

      const updatedColumns = board.colonnes.map(col => ({
        ...col,
        cartes: col.cartes.filter(c => c.id !== selectedCard.id)
      }));

      await handleSaveBoard({ ...board, colonnes: updatedColumns });
      setCardModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
    }
  };

  const handleMoveCard = (cardId, fromColumnId, toColumnId, boardId, insertIndex = null) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    let card = null;
    let fromCardIndex = -1;
    
    // Trouver la carte à déplacer
    const fromColumn = board.colonnes.find(col => col.id === fromColumnId);
    if (fromColumn) {
      fromCardIndex = fromColumn.cartes.findIndex(c => c.id === cardId);
      if (fromCardIndex !== -1) {
        card = fromColumn.cartes[fromCardIndex];
      }
    }

    if (!card) return;

    const updatedColumns = board.colonnes.map(col => {
      if (col.id === fromColumnId) {
        // Retirer la carte de la colonne source
        return { ...col, cartes: col.cartes.filter(c => c.id !== cardId) };
      }
      if (col.id === toColumnId) {
        // Ajouter la carte à la colonne destination
        const newCards = [...col.cartes];
        if (insertIndex !== null && insertIndex >= 0 && insertIndex <= newCards.length) {
          newCards.splice(insertIndex, 0, card);
        } else {
          newCards.push(card);
        }
        // Mettre à jour l'ordre des cartes
        return { ...col, cartes: newCards.map((c, idx) => ({ ...c, ordre: idx })) };
      }
      return col;
    });

    handleSaveBoard({ ...board, colonnes: updatedColumns });
  };

  return (
    <Layout>
      <div className="boards-page">
        <div className="boards-sidebar">
          <div className="boards-header">
            <h1>Tableaux</h1>
            <button className="btn-primary" onClick={handleCreateBoard}>
              + Nouveau
            </button>
          </div>
          <div className="boards-list">
            {boards.map(board => (
              <div
                key={board.id}
                className={`board-item ${selectedBoard?.id === board.id ? 'active' : ''}`}
                onClick={() => setSelectedBoard(board)}
              >
                {board.nom}
              </div>
            ))}
          </div>
        </div>

        <div className="boards-content">
          {selectedBoard ? (
            <div className="board-view">
              <div className="board-header">
                <h2>{selectedBoard.nom}</h2>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setModalOpen(true);
                  }}
                >
                  Modifier
                </button>
              </div>
              <div className="board-columns">
                {selectedBoard.colonnes
                  .sort((a, b) => a.ordre - b.ordre)
                  .map(column => (
                    <div key={column.id} className="board-column">
                      <div className="column-header">
                        <h3>{column.nom}</h3>
                        <span className="column-count">{column.cartes.length}</span>
                      </div>
                      <div 
                        className="column-cards"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('drag-over');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('drag-over');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('drag-over');
                          const cardId = e.dataTransfer.getData('cardId');
                          const fromColumn = e.dataTransfer.getData('fromColumn');
                          if (cardId && fromColumn) {
                            // Calculer l'index d'insertion
                            const cards = Array.from(e.currentTarget.children);
                            const afterElement = cards.find(child => {
                              const rect = child.getBoundingClientRect();
                              return e.clientY < rect.top + rect.height / 2;
                            });
                            const insertIndex = afterElement ? cards.indexOf(afterElement) : cards.length;
                            handleMoveCard(cardId, fromColumn, column.id, selectedBoard.id, insertIndex);
                          }
                        }}
                      >
                        {column.cartes
                          .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
                          .map(card => (
                          <div
                            key={card.id}
                            className="board-card"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('cardId', card.id);
                              e.dataTransfer.setData('fromColumn', column.id);
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <div className="card-content">
                              <h4>{card.titre}</h4>
                              {card.description && <p>{card.description}</p>}
                            </div>
                            <button
                              className="card-edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCard(card, column.id);
                              }}
                              title="Modifier la carte"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        className="add-card-btn"
                        onClick={() => handleAddCard(column.id, selectedBoard.id)}
                      >
                        + Ajouter une carte
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="boards-empty">
              <p>Créez votre premier tableau</p>
            </div>
          )}
        </div>

        {modalOpen && selectedBoard && (
          <BoardModal
            board={selectedBoard}
            onClose={() => setModalOpen(false)}
            onSave={handleSaveBoard}
            onDelete={() => {
              const updated = boards.filter(b => b.id !== selectedBoard.id);
              saveBoards(updated);
              setSelectedBoard(updated.length > 0 ? updated[0] : null);
              setModalOpen(false);
            }}
          />
        )}

        {cardModalOpen && selectedBoard && (
          <CardModal
            card={selectedCard}
            board={selectedBoard}
            onClose={() => {
              setCardModalOpen(false);
              setSelectedCard(null);
              setCardModalColumnId(null);
            }}
            onSave={handleSaveCard}
            onDelete={selectedCard ? handleDeleteCard : undefined}
          />
        )}
      </div>
    </Layout>
  );
};

