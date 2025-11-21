import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { BoardModal } from '../../components/BoardModal/BoardModal';
import './Boards.scss';

export const Boards = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = () => {
    try {
      const saved = localStorage.getItem('monDrive_boards');
      if (saved) {
        const loaded = JSON.parse(saved);
        setBoards(loaded);
        if (loaded.length > 0 && !selectedBoard) {
          setSelectedBoard(loaded[0]);
        }
      } else {
        // Exemples de tableaux Kanban
        const exampleBoards = [
          {
            id: '1',
            nom: 'Projet Alpha',
            description: 'Tableau de suivi du projet principal',
            colonnes: [
              {
                id: 'col1',
                nom: 'À faire',
                cartes: [
                  { id: 'card1', titre: 'Créer la maquette', description: 'Design de la page d\'accueil', ordre: 0 },
                  { id: 'card2', titre: 'Écrire les tests', description: 'Tests unitaires pour le module X', ordre: 1 },
                ],
                ordre: 0,
              },
              {
                id: 'col2',
                nom: 'En cours',
                cartes: [
                  { id: 'card3', titre: 'Développer l\'API', description: 'Créer les endpoints REST', ordre: 0 },
                ],
                ordre: 1,
              },
              {
                id: 'col3',
                nom: 'Terminé',
                cartes: [
                  { id: 'card4', titre: 'Setup du projet', description: 'Configuration initiale', ordre: 0 },
                  { id: 'card5', titre: 'Documentation', description: 'Rédaction de la doc technique', ordre: 1 },
                ],
                ordre: 2,
              },
            ],
            dateCreation: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '2',
            nom: 'Bugs à corriger',
            description: 'Liste des bugs identifiés',
            colonnes: [
              {
                id: 'col4',
                nom: 'Critique',
                cartes: [
                  { id: 'card6', titre: 'Bug login', description: 'Problème de connexion sur mobile', ordre: 0 },
                ],
                ordre: 0,
              },
              {
                id: 'col5',
                nom: 'Mineur',
                cartes: [
                  { id: 'card7', titre: 'Typo dans le footer', description: 'Corriger "contat" en "contact"', ordre: 0 },
                ],
                ordre: 1,
              },
            ],
            dateCreation: new Date(Date.now() - 172800000).toISOString(),
          },
        ];
        setBoards(exampleBoards);
        setSelectedBoard(exampleBoards[0]);
        localStorage.setItem('monDrive_boards', JSON.stringify(exampleBoards));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveBoards = (newBoards) => {
    localStorage.setItem('monDrive_boards', JSON.stringify(newBoards));
    setBoards(newBoards);
  };

  const handleCreateBoard = () => {
    const newBoard = {
      id: Date.now().toString(),
      nom: 'Nouveau tableau',
      colonnes: [
        { id: '1', nom: 'À faire', cartes: [], ordre: 0 },
        { id: '2', nom: 'En cours', cartes: [], ordre: 1 },
        { id: '3', nom: 'Terminé', cartes: [], ordre: 2 },
      ],
      dateCreation: new Date().toISOString(),
    };
    const updated = [...boards, newBoard];
    saveBoards(updated);
    setSelectedBoard(newBoard);
  };

  const handleSaveBoard = (board) => {
    const updated = boards.map(b => b.id === board.id ? board : b);
    saveBoards(updated);
    setSelectedBoard(board);
  };

  const handleAddCard = (columnId, boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const newCard = {
      id: Date.now().toString(),
      titre: 'Nouvelle carte',
    };

    const updated = board.colonnes.map(col =>
      col.id === columnId
        ? { ...col, cartes: [...col.cartes, newCard] }
        : col
    );

    handleSaveBoard({ ...board, colonnes: updated });
  };

  const handleMoveCard = (cardId, fromColumnId, toColumnId, boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    let card = null;
    const updatedColumns = board.colonnes.map(col => {
      if (col.id === fromColumnId) {
        const cardIndex = col.cartes.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
          card = col.cartes[cardIndex];
          return { ...col, cartes: col.cartes.filter(c => c.id !== cardId) };
        }
      }
      if (col.id === toColumnId && card) {
        return { ...col, cartes: [...col.cartes, card] };
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
                      <div className="column-cards">
                        {column.cartes.map(card => (
                          <div
                            key={card.id}
                            className="board-card"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('cardId', card.id);
                              e.dataTransfer.setData('fromColumn', column.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const cardId = e.dataTransfer.getData('cardId');
                              const fromColumn = e.dataTransfer.getData('fromColumn');
                              if (fromColumn !== column.id) {
                                handleMoveCard(cardId, fromColumn, column.id, selectedBoard.id);
                              }
                            }}
                          >
                            <h4>{card.titre}</h4>
                            {card.description && <p>{card.description}</p>}
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
      </div>
    </Layout>
  );
};

