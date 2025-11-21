import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ContactModal } from '../../components/ContactModal/ContactModal';
import './Contacts.scss';

export const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    try {
      const saved = localStorage.getItem('monDrive_contacts');
      if (saved) {
        setContacts(JSON.parse(saved));
      } else {
        // Exemples de contacts
        const exampleContacts = [
          {
            id: '1',
            prenom: 'Marie',
            nom: 'Dupont',
            email: 'marie.dupont@email.com',
            telephone: '01 23 45 67 89',
            entreprise: 'TechCorp',
            poste: 'Développeuse',
            adresse: '123 Rue de la Paix, Paris',
            notes: 'Contact principal pour le projet X',
          },
          {
            id: '2',
            prenom: 'Jean',
            nom: 'Martin',
            email: 'jean.martin@email.com',
            telephone: '06 12 34 56 78',
            entreprise: 'DesignStudio',
            poste: 'Designer',
          },
          {
            id: '3',
            prenom: 'Sophie',
            nom: 'Bernard',
            email: 'sophie.bernard@email.com',
            telephone: '01 98 76 54 32',
            entreprise: 'MarketingPro',
            poste: 'Chef de projet',
            adresse: '456 Avenue des Champs, Lyon',
          },
        ];
        setContacts(exampleContacts);
        localStorage.setItem('monDrive_contacts', JSON.stringify(exampleContacts));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveContacts = (newContacts) => {
    localStorage.setItem('monDrive_contacts', JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const handleSave = (contact) => {
    if (selectedContact) {
      saveContacts(contacts.map(c => c.id === selectedContact.id ? contact : c));
    } else {
      saveContacts([...contacts, contact]);
    }
    setModalOpen(false);
    setSelectedContact(null);
  };

  const handleDelete = (contactId) => {
    saveContacts(contacts.filter(c => c.id !== contactId));
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

