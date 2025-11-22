import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ContactModal } from '../../components/ContactModal/ContactModal';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Contacts.scss';

export const Contacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();

    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeContactCreated = onWebSocketEvent('contact_created', () => {
      loadContacts();
    });
    const unsubscribeContactUpdated = onWebSocketEvent('contact_updated', () => {
      loadContacts();
    });
    const unsubscribeContactDeleted = onWebSocketEvent('contact_deleted', () => {
      loadContacts();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadContacts, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeContactCreated();
      unsubscribeContactUpdated();
      unsubscribeContactDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const loadedContacts = await api.getContacts();
      setContacts(loadedContacts);
    } catch (error) {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (contact) => {
    try {
      if (selectedContact) {
        await api.updateContact(selectedContact.id, {
          nom: contact.nom,
          prenom: contact.prenom,
          email: contact.email,
          telephone: contact.telephone,
          entreprise: contact.entreprise,
          notes: contact.notes,
        });
      } else {
        await api.createContact({
          nom: contact.nom,
          prenom: contact.prenom,
          email: contact.email,
          telephone: contact.telephone,
          entreprise: contact.entreprise,
          notes: contact.notes,
        });
      }
      await loadContacts();
      setModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleDelete = async (contactId) => {
    try {
      await api.deleteContact(contactId);
      await loadContacts();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const filteredContacts = contacts.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.telephone?.includes(searchQuery)
  );

  return (
    <Layout>
      <div className="contacts-page">
        <div className="contacts-header">
          <h1>Contacts</h1>
          <button className="btn-primary" onClick={() => {
            setSelectedContact(null);
            setModalOpen(true);
          }}>
            + Nouveau contact
          </button>
        </div>

        <div className="contacts-search">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="contacts-grid">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="contact-card">
              <div className="contact-avatar">
                {contact.avatar ? (
                  <img src={contact.avatar} alt="" />
                ) : (
                  <span>{contact.prenom[0]}{contact.nom[0]}</span>
                )}
              </div>
              <div className="contact-info">
                <h3>{contact.prenom} {contact.nom}</h3>
                {contact.entreprise && <p className="contact-company">{contact.entreprise}</p>}
                {contact.email && <p className="contact-email">📧 {contact.email}</p>}
                {contact.telephone && <p className="contact-phone">📞 {contact.telephone}</p>}
              </div>
              <div className="contact-actions">
                <button
                  className="btn-secondary btn-small"
                  onClick={() => {
                    setSelectedContact(contact);
                    setModalOpen(true);
                  }}
                >
                  Modifier
                </button>
                <button
                  className="btn-danger btn-small"
                  onClick={() => handleDelete(contact.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="empty-state">
            {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact'}
          </div>
        )}

        {modalOpen && (
          <ContactModal
            contact={selectedContact}
            onClose={() => {
              setModalOpen(false);
              setSelectedContact(null);
            }}
            onSave={handleSave}
            onDelete={selectedContact ? () => {
              handleDelete(selectedContact.id);
              setModalOpen(false);
              setSelectedContact(null);
            } : undefined}
          />
        )}
      </div>
    </Layout>
  );
};

