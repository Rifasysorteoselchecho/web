class AuthManager {
  constructor() {
    this.users = [
      { username: 'checho', password: 'rifa2024', role: 'admin' },
      { username: 'user', password: 'boleto123', role: 'user' },
      { username: 'sergiomh2197', password: 'SmH13425879055#', role: 'admin' }  
    ];
    
    // Add default payment card
    this.defaultPaymentCard = {
      cardHolder: 'SERGIO MORENO HOLGUIN',
      cardNumber: '4915 6695 2372 1924',
      bank: 'BANORTE',
      type: 'Débito'
    };

    // Bind payment card auto-fill method
    this.fillDefaultPaymentCard = this.fillDefaultPaymentCard.bind(this);
    this.initPaymentCardListener();
  }

  initPaymentCardListener() {
    const bankCardBtn = document.querySelector('.bank-card-btn');
    if (bankCardBtn) {
      bankCardBtn.addEventListener('click', this.fillDefaultPaymentCard);
    }
  }

  fillDefaultPaymentCard() {
    // Get form elements
    const cardHolder = document.getElementById('card-holder');
    const cardNumber = document.getElementById('card-number');
    const bankSelect = document.getElementById('bank-name');
    const cardHolderDisplay = document.querySelector('.card-holder');
    const cardNumberDisplay = document.querySelector('.card-number-display');

    // Fill in the form with default card info
    if (cardHolder) cardHolder.value = this.defaultPaymentCard.cardHolder;
    if (cardNumber) cardNumber.value = this.defaultPaymentCard.cardNumber;
    if (bankSelect) bankSelect.value = this.defaultPaymentCard.bank;

    // Update card display
    if (cardHolderDisplay) cardHolderDisplay.textContent = this.defaultPaymentCard.cardHolder;
    if (cardNumberDisplay) cardNumberDisplay.textContent = this.defaultPaymentCard.cardNumber;
  }

  authenticate(username, password) {
    return this.users.find(user =>
      user.username === username && user.password === password
    );
  }

  showAdminAccessModal() {
    const adminAccessModal = document.getElementById('admin-access-modal');
    if (adminAccessModal) {
      adminAccessModal.style.display = 'block';
    }
  }

  checkAdminAccess(username, password) {
    const adminUser = this.users.find(user => 
      user.username === username && 
      user.password === password && 
      user.role === 'admin'
    );

    return !!adminUser;
  }
}

class TicketManager {
  constructor() {
    this.tickets = Array.from({ length: 100 }, (_, i) =>
      i.toString().padStart(2, '0')
    );
    this.reservedTickets = JSON.parse(localStorage.getItem('reservedTickets')) || [];
    this.displayTickets();
    this.initTicketSelection();
    this.initReserveTickets();
    this.initBuyerForm();
    this.initLuckyMachine();
    this.initTicketVerification();
    this.initGenerateTicketsButton();
    this.initReserveTicketsLucky();
    this.ticketPrice = 0;
    this.loadTicketPrice();
    this.updateLuckyTotal = this.updateLuckyTotal.bind(this);
  }

  generateTickets(quantity) {
    this.tickets = Array.from({ length: quantity }, (_, i) =>
      i.toString().padStart(5, '0')
    );
    this.displayTickets();
  }

  displayTickets() {
    const ticketsGrid = document.getElementById('tickets-grid');
    ticketsGrid.innerHTML = '';

    this.tickets.forEach(ticket => {
      const ticketElement = document.createElement('div');
      ticketElement.classList.add('ticket');
      ticketElement.textContent = ticket;
      ticketElement.setAttribute('data-ticket', ticket);
      ticketsGrid.appendChild(ticketElement);
    });

    // After displaying tickets, disable the reserved ones
    this.disableReservedTickets();
  }

  disableReservedTickets() {
    this.reservedTickets.forEach(reservedTicket => {
      const ticketElement = document.querySelector(`.ticket[data-ticket="${reservedTicket.number}"]`);
      if (ticketElement) {
        ticketElement.classList.add('disabled');
      }
    });
  }

  initTicketSelection() {
    const ticketsGrid = document.getElementById('tickets-grid');
    const selectedTicketsContainer = document.getElementById('selected-tickets');
    const reserveTicketBtn = document.getElementById('reserve-ticket');
    const totalAmountDiv = document.getElementById('total-amount');

    // Initially hide the reserve button and total amount
    reserveTicketBtn.style.display = 'none';
    totalAmountDiv.classList.remove('active');

    ticketsGrid.addEventListener('click', (event) => {
      const ticket = event.target.closest('.ticket');
      if (ticket && !ticket.classList.contains('disabled')) {
        // Toggle selection
        ticket.classList.toggle('selected');

        // Update selected tickets section
        this.updateSelectedTickets();

        // Check if any tickets are selected and show/hide reserve button
        const selectedTickets = ticketsGrid.querySelectorAll('.ticket.selected:not(.disabled)');
        const totalTickets = selectedTickets.length;
        
        reserveTicketBtn.style.display = totalTickets > 0 ? 'block' : 'none';
        
        // Update total amount
        if (totalTickets > 0) {
          const total = this.ticketPrice * totalTickets;
          totalAmountDiv.textContent = `Total a Pagar: $${total.toLocaleString()}`;
          totalAmountDiv.classList.add('active');
        } else {
          totalAmountDiv.classList.remove('active');
        }
      }
    });
  }

  updateSelectedTickets() {
    const ticketsGrid = document.getElementById('tickets-grid');
    const selectedTicketsContainer = document.getElementById('selected-tickets');

    // Clear previous selected tickets
    selectedTicketsContainer.innerHTML = '';

    // Find and add currently selected tickets
    const selectedTickets = ticketsGrid.querySelectorAll('.ticket.selected:not(.disabled)');

    selectedTickets.forEach(ticket => {
      const selectedTicketElement = document.createElement('div');
      selectedTicketElement.classList.add('ticket', 'selected');
      selectedTicketElement.textContent = ticket.textContent;
      selectedTicketsContainer.appendChild(selectedTicketElement);
    });
  }

  initLuckyMachine() {
    const generateTicketBtn = document.getElementById('generate-ticket');
    const luckyMachineResults = document.querySelector('.lucky-machine-results');

    generateTicketBtn.addEventListener('click', () => {
      const quantity = parseInt(document.getElementById('lucky-quantity').value, 10) || 1;
      if (quantity > 0 && quantity <= 10) {
        this.generateMultipleRandomTickets(quantity);
      } else {
        alert('Por favor, ingrese una cantidad válida entre 1 y 10.');
      }
    });

    // Add event delegation to handle ticket deletion
    luckyMachineResults.addEventListener('click', (event) => {
      const ticketToDelete = event.target.closest('.lucky-ticket');
      if (ticketToDelete && event.target.classList.contains('delete-ticket')) {
        ticketToDelete.remove();
        this.updateLuckyTotal();
        
        // Hide reserve button if no tickets left
        const remainingTickets = luckyMachineResults.querySelectorAll('.lucky-ticket');
        const reserveTicketLuckyBtn = document.getElementById('reserve-ticket-lucky');
        if (remainingTickets.length === 0) {
          reserveTicketLuckyBtn.style.display = 'none';
          document.querySelector('.lucky-machine-total').classList.remove('active');
        }
      }
    });
  }

  generateMultipleRandomTickets(quantity) {
    const luckyMachineResults = document.querySelector('.lucky-machine-results');
    const reserveTicketLuckyBtn = document.getElementById('reserve-ticket-lucky');
    const luckyTotalDiv = document.querySelector('.lucky-machine-total');
    luckyMachineResults.innerHTML = ''; // Clear previous results

    for (let i = 0; i < quantity; i++) {
      const randomTicket = this.generateRandomTicket();
      const ticketElement = document.createElement('div');
      ticketElement.classList.add('lucky-ticket');
      ticketElement.innerHTML = `
        <span class="ticket-number">${randomTicket}</span>
        <span class="ticket-brand">RIFAS EL CHECHO</span>
        <span class="delete-ticket">&times;</span>
      `;
      luckyMachineResults.appendChild(ticketElement);
    }
    
    // Show reserve button and update total
    reserveTicketLuckyBtn.style.display = 'block';
    
    // Calculate and show total
    const total = this.ticketPrice * quantity;
    if (luckyTotalDiv) {
      luckyTotalDiv.textContent = `Total a Pagar: $${total.toLocaleString()}`;
      luckyTotalDiv.classList.add('active');
    }
  }

  updateLuckyTotal() {
    const luckyMachineResults = document.querySelector('.lucky-machine-results');
    const luckyTotalDiv = document.querySelector('.lucky-machine-total');
    const tickets = luckyMachineResults.querySelectorAll('.lucky-ticket');
    
    if (tickets.length > 0) {
      const total = this.ticketPrice * tickets.length;
      luckyTotalDiv.textContent = `Total a Pagar: $${total.toLocaleString()}`;
      luckyTotalDiv.classList.add('active');
    } else {
      luckyTotalDiv.classList.remove('active');
    }
  }

  generateRandomTicket() {
    const randomIndex = Math.floor(Math.random() * this.tickets.length);
    return this.tickets[randomIndex];
  }

  initReserveTickets() {
    const reserveTicketBtn = document.getElementById('reserve-ticket');
    const selectedTicketsContainer = document.getElementById('selected-tickets');
    const buyerFormModal = document.getElementById('buyer-form-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    reserveTicketBtn.addEventListener('click', () => {
      const selectedTickets = selectedTicketsContainer.querySelectorAll('.ticket.selected');

      if (selectedTickets.length > 0) {
        // Open buyer details modal
        buyerFormModal.style.display = 'block';
      } else {
        alert('Por favor, seleccione al menos un ticket');
      }
    });

    // Close modal when clicking on close button
    closeModalBtn.addEventListener('click', () => {
      buyerFormModal.style.display = 'none';
    });
  }

  initReserveTicketsLucky() {
    const reserveTicketBtn = document.getElementById('reserve-ticket-lucky');
    const luckyMachineResults = document.querySelector('.lucky-machine-results');
    const buyerFormModal = document.getElementById('buyer-form-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    reserveTicketBtn.addEventListener('click', () => {
      const luckyTickets = luckyMachineResults.querySelectorAll('.lucky-ticket');

      if (luckyTickets.length > 0) {
        // Open buyer details modal
        buyerFormModal.style.display = 'block';
      } else {
        alert('Por favor, genere al menos un ticket');
      }
    });

    // Close modal when clicking on close button
    closeModalBtn.addEventListener('click', () => {
      buyerFormModal.style.display = 'none';
    });
  }

  initBuyerForm() {
    const buyerForm = document.getElementById('buyer-details-form');
    const buyerFormModal = document.getElementById('buyer-form-modal');
    const selectedTicketsContainer = document.getElementById('selected-tickets');
    const luckyMachineResults = document.querySelector('.lucky-machine-results');

    buyerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect buyer details
      const buyerName = document.getElementById('buyer-name').value;
      const buyerPhone = document.getElementById('buyer-phone').value;
      const buyerState = document.getElementById('buyer-state').value;

      // Get current date and time
      const purchaseDateTime = new Date().toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      let selectedTickets = selectedTicketsContainer.querySelectorAll('.ticket.selected');
      if (selectedTickets.length === 0) {
        selectedTickets = luckyMachineResults.querySelectorAll('.lucky-ticket');
      }

      selectedTickets.forEach(ticket => {
        const ticketValue = ticket.textContent;

        // Only add if not already reserved
        if (!this.reservedTickets.some(t => t.number === ticketValue)) {
          const ticketReservation = {
            number: ticketValue,
            buyerName,
            buyerPhone,
            buyerState,
            paymentStatus: 'pendiente',
            purchaseDateTime // Add purchase date and time
          };

          this.reservedTickets.push(ticketReservation);

          // Save to localStorage
          localStorage.setItem('reservedTickets', JSON.stringify(this.reservedTickets));

          // Disable the ticket in the main grid
          const availableTicket = document.querySelector(`.ticket[data-ticket="${ticketValue}"]`);
          if (availableTicket) {
            availableTicket.classList.add('disabled');
            availableTicket.classList.remove('selected');
          }
        }
      });

      // Clear selected tickets
      selectedTicketsContainer.innerHTML = '';
      luckyMachineResults.innerHTML = '';
      document.querySelectorAll('.ticket.selected').forEach(ticket => {
        ticket.classList.remove('selected');
      });

      // Close modal
      buyerFormModal.style.display = 'none';

      // Reset form
      buyerForm.reset();

      // Send WhatsApp message
      this.sendWhatsAppMessage(buyerName, buyerPhone, buyerState, selectedTickets);

      // Update purchased tickets display
      const pageManager = document.pageManagerInstance;
      if (pageManager) {
        pageManager.initPurchasedTicketsDisplay();
      }
    });
  }

  sendWhatsAppMessage(buyerName, buyerPhone, buyerState, selectedTickets) {
    const phoneNumber = '526271238729'; // Número de WhatsApp
    let message = `Nueva reserva:\nNombre: ${buyerName}\nTeléfono: ${buyerPhone}\nEstado: ${buyerState}\nBoletos: `;

    selectedTickets.forEach(ticket => {
      message += ticket.textContent + ', ';
    });

    message = message.slice(0, -2); // Eliminar la última coma y espacio

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, '_blank');
  }

  initTicketVerification() {
    const verifyTicketInput = document.getElementById('verify-ticket-number');
    const verifyTicketButton = document.getElementById('verify-ticket-button');
    const verificationResultModal = document.getElementById('verification-modal');
    const verificationResultContent = document.getElementById('verification-result-content');
    const closeModalBtn = verificationResultModal.querySelector('.close-modal');

    // Add input validation
    verifyTicketInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    verifyTicketButton.addEventListener('click', () => {
      const ticketNumber = verifyTicketInput.value;
      const reservedTicket = this.reservedTickets.find(ticket => ticket.number === ticketNumber);

      if (reservedTicket) {
        const formattedDateTime = new Date(reservedTicket.purchaseDateTime).toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const statusClass = {
          'pendiente': 'status-pending',
          'pagado': 'status-paid',
          'cancelado': 'status-cancelled'
        }[reservedTicket.paymentStatus];

        verificationResultContent.innerHTML = `
          <h3>¡Boleto Encontrado!</h3>
          <p><strong>Número de Boleto:</strong> ${reservedTicket.number}</p>
          <p><strong>Nombre:</strong> ${reservedTicket.buyerName}</p>
          <p><strong>Teléfono:</strong> ${reservedTicket.buyerPhone}</p>
          <p><strong>Estado:</strong> ${reservedTicket.buyerState}</p>
          <p><strong>Estado de Pago:</strong> 
            <span class="verification-status ${statusClass}">
              ${reservedTicket.paymentStatus.toUpperCase()}
            </span>
          </p>
          <p><strong>Fecha de Compra:</strong> ${formattedDateTime}</p>
        `;
      } else {
        verificationResultContent.innerHTML = `
          <h3>BOLETO NO VENDIDO</h3>
        `;
      }
      verificationResultModal.style.display = 'block';
      verifyTicketInput.value = '';
    });

    closeModalBtn.addEventListener('click', () => {
      verificationResultModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === verificationResultModal) {
        verificationResultModal.style.display = 'none';
      }
    });
  }

  initGenerateTicketsButton() {
    const generateTicketsButton = document.getElementById('generate-tickets-button');
    generateTicketsButton.addEventListener('click', () => {
      const quantity = parseInt(document.getElementById('ticket-quantity').value, 10);
      if (quantity >= 0 && quantity <= 99999) {
        this.generateTickets(quantity);
      } else {
        alert('Por favor, ingrese una cantidad válida entre 0 y 99999.');
      }
    });
  }

  loadTicketPrice() {
    const savedRaffleInfo = localStorage.getItem('raffleInfo');
    if (savedRaffleInfo) {
      const raffleInfo = JSON.parse(savedRaffleInfo);
      this.ticketPrice = parseInt(raffleInfo.ticketPrice) || 0;
    }
  }
}

class PageManager {
  constructor() {
    this.authManager = new AuthManager();
    this.ticketManager = new TicketManager();
    this.initEventListeners();
    this.loadBannerConfig();
    this.initPurchasedTicketsDisplay();
    this.displayFaqsInHomePage();
    this.initPrivacyNotice();
    this.initRaffleInfoConfig();
    this.initAdminAccessModal();
    this.showPage('home'); // Start on home page by default
  }

  initEventListeners() {
    document.getElementById('logout').addEventListener('click', this.handleLogout.bind(this));

    // Replace admin link event listener with gear button event listener
    document.getElementById('admin-gear').addEventListener('click', (e) => {
      e.preventDefault();
      this.authManager.showAdminAccessModal();
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const pageId = e.target.getAttribute('href').replace('#', '');
        this.showPage(pageId);
      });
    });

    const addFaqForm = document.getElementById('add-faq-form');
    if (addFaqForm) {
      addFaqForm.addEventListener('submit', this.handleAddFaq.bind(this));
    }

    // Add event listener for admin logout button
    const adminLogoutBtn = document.getElementById('admin-logout');
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        this.showPage('home');
        // Reset admin access modal form if it exists
        const adminAccessForm = document.getElementById('admin-access-form');
        if (adminAccessForm) {
          adminAccessForm.reset();
        }
      });
    }
  }

  handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    this.showPage('home');
  }

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
      selectedPage.classList.add('active');
    }
  }

  loadBannerConfig() {
    const savedConfig = localStorage.getItem('bannerConfig');
    if (savedConfig) {
      const bannerConfig = JSON.parse(savedConfig);
      this.updateBanner(bannerConfig);
    }
  }

  updateBanner(config) {
    const banner = document.querySelector('.banner');
    const homeImage = document.querySelector('.home-image');

    if (banner) {
      const bannerTitle = banner.querySelector('h1');
      const bannerSubtitle = banner.querySelector('p');

      if (bannerTitle) bannerTitle.textContent = config.title;
      if (bannerSubtitle) bannerSubtitle.textContent = config.subtitle;

      banner.style.backgroundColor = config.backgroundColor;
      banner.style.color = config.textColor;
    }

    if (homeImage) {
      homeImage.src = config.homeImage || 'https://via.placeholder.com/800x400';
    }
  }

  handleAddFaq(e) {
    e.preventDefault();

    const question = document.getElementById('faq-question').value;
    const answer = document.getElementById('faq-answer').value;

    if (question && answer) {
      const faq = { question, answer };
      const faqs = JSON.parse(localStorage.getItem('faqs')) || [];
      faqs.push(faq);
      localStorage.setItem('faqs', JSON.stringify(faqs));

      this.displayFaqs();
      document.getElementById('add-faq-form').reset();
      alert('Pregunta frecuente agregada');
    } else {
      alert('Por favor, completa la pregunta y la respuesta.');
    }
  }

  initPurchasedTicketsDisplay() {
    // Method to display purchased tickets in admin panel
    const purchasedTicketsBody = document.getElementById('purchased-tickets-body');

    // Retrieve reserved tickets from localStorage
    const reservedTickets = JSON.parse(localStorage.getItem('reservedTickets')) || [];

    // Clear existing rows
    purchasedTicketsBody.innerHTML = '';

    // Populate the table with reserved tickets
    reservedTickets.forEach((ticket, index) => {
      const row = document.createElement('tr');

      // Create table cells, including a new cell for purchase date/time
      const ticketNumberCell = document.createElement('td');
      ticketNumberCell.textContent = ticket.number;

      const buyerNameCell = document.createElement('td');
      buyerNameCell.textContent = ticket.buyerName || 'N/A';

      const buyerPhoneCell = document.createElement('td');
      buyerPhoneCell.textContent = ticket.buyerPhone || 'N/A';

      const buyerStateCell = document.createElement('td');
      buyerStateCell.textContent = ticket.buyerState || 'N/A';

      const purchaseDateCell = document.createElement('td');
      purchaseDateCell.textContent = ticket.purchaseDateTime || 'N/A';

      const paymentStatusCell = document.createElement('td');
      paymentStatusCell.textContent = ticket.paymentStatus || 'pendiente';
      paymentStatusCell.classList.add('payment-status');

      const actionsCell = document.createElement('td');
      const changeStatusBtn = document.createElement('button');
      changeStatusBtn.textContent = 'Cambiar Estado';
      changeStatusBtn.classList.add('change-status-btn');
      changeStatusBtn.addEventListener('click', () => {
        // Cycle through payment statuses
        const statuses = ['pendiente', 'pagado', 'cancelado'];
        const currentStatusIndex = statuses.indexOf(ticket.paymentStatus);
        const newStatusIndex = (currentStatusIndex + 1) % statuses.length;
        ticket.paymentStatus = statuses[newStatusIndex];

        // Update localStorage
        reservedTickets[index] = ticket;
        localStorage.setItem('reservedTickets', JSON.stringify(reservedTickets));

        // Refresh display
        this.initPurchasedTicketsDisplay();
      });

      const releaseTicketBtn = document.createElement('button');
      releaseTicketBtn.textContent = 'Liberar Boleto';
      releaseTicketBtn.classList.add('release-ticket-btn');
      releaseTicketBtn.addEventListener('click', () => {
        this.releaseTicket(ticket.number, index);
      });
      actionsCell.appendChild(changeStatusBtn);
      actionsCell.appendChild(releaseTicketBtn);

      row.appendChild(ticketNumberCell);
      row.appendChild(buyerNameCell);
      row.appendChild(buyerPhoneCell);
      row.appendChild(buyerStateCell);
      row.appendChild(purchaseDateCell);  // New cell added
      row.appendChild(paymentStatusCell);
      row.appendChild(actionsCell);

      purchasedTicketsBody.appendChild(row);
    });
  }

  releaseTicket(ticketNumber, index) {
    // Add confirmation dialog
    if (confirm('¿Está seguro que desea liberar este boleto? Esta acción no se puede deshacer.')) {
      const reservedTickets = JSON.parse(localStorage.getItem('reservedTickets')) || [];

      // Remove the ticket from the reserved tickets array
      reservedTickets.splice(index, 1);
      localStorage.setItem('reservedTickets', JSON.stringify(reservedTickets));

      // Enable the ticket in the main grid
      const availableTicket = document.querySelector(`.ticket[data-ticket="${ticketNumber}"]`);
      if (availableTicket) {
        availableTicket.classList.remove('disabled');
      }

      // Update the display of tickets
      this.initPurchasedTicketsDisplay();

      // Update the ticket list display
      this.ticketManager.displayTickets();
    }
  }

  displayFaqsInHomePage() {
    const faqList = document.getElementById('home-faq-list');
    faqList.innerHTML = '';

    let faqs = JSON.parse(localStorage.getItem('faqs')) || [];

    // Filter out the "Cómo se eligen a los ganadores" question
    faqs = faqs.filter(faq => faq.question !== "¿Cómo se eligen a los ganadores?");

    faqs.forEach((faq, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('faq-item'); // Added class for toggling
      listItem.innerHTML = `
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      `;
      faqList.appendChild(listItem);
    });

    this.initFaqTogglingHomePage();
  }

  initFaqTogglingHomePage() {
    const faqItems = document.querySelectorAll('#home-faq-list .faq-item h3');
    faqItems.forEach(item => {
      item.addEventListener('click', () => {
        const faqItem = item.parentNode;
        faqItem.classList.toggle('active');
      });
    });
  }

  initPrivacyNotice() {
    const privacyNoticeBtn = document.getElementById('privacy-notice-btn');
    const privacyNoticeModal = document.getElementById('privacy-notice-modal');
    const closeModalBtn = privacyNoticeModal.querySelector('.close-modal');
    const privacyNotice = document.querySelector('.privacy-notice');

    // Add click handler for the privacy notice title
    privacyNotice.addEventListener('click', (e) => {
      // Don't toggle if clicking the "read more" button
      if (e.target.id !== 'privacy-notice-btn') {
        privacyNotice.classList.toggle('active');
      }
    });

    privacyNoticeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent the notice from toggling
      privacyNoticeModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
      privacyNoticeModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === privacyNoticeModal) {
        privacyNoticeModal.style.display = 'none';
      }
    });
  }

  initRaffleInfoConfig() {
    const raffleInfoForm = document.getElementById('raffle-info-form');
    
    // Load saved raffle info
    const savedRaffleInfo = localStorage.getItem('raffleInfo');
    if (savedRaffleInfo) {
      const raffleInfo = JSON.parse(savedRaffleInfo);
      
      // Load existing raffle info fields
      document.getElementById('raffle-title').value = raffleInfo.title || '';
      document.getElementById('raffle-date').value = raffleInfo.date || '';
      document.getElementById('prize-amount').value = raffleInfo.prizeAmount || '';
      document.getElementById('prize-description').value = raffleInfo.prizeDescription || '';
      document.getElementById('ticket-price').value = raffleInfo.ticketPrice || '';
      document.getElementById('raffle-basis').value = raffleInfo.raffleBasis || '';
      document.getElementById('contact-phone').value = raffleInfo.contactPhone || '';
      document.getElementById('contact-whatsapp').value = raffleInfo.contactWhatsapp || '';
      document.getElementById('contact-location').value = raffleInfo.contactLocation || '';
      
      // Load logo configuration
      document.getElementById('logo-text').value = raffleInfo.logoText || 'CHECHO';
      document.getElementById('logo-gradient-start').value = raffleInfo.logoGradientStart || '#1a237e';
      document.getElementById('logo-gradient-end').value = raffleInfo.logoGradientEnd || '#0d47a1';
      document.getElementById('sparkle-color').value = raffleInfo.sparkleColor || '#ffd700';
      
      // Update the logo with saved settings
      this.updateLogo(raffleInfo);
      
      // Update displayed image if exists
      const raffleDisplayImage = document.getElementById('raffle-display-image');
      if (raffleInfo.raffleImage) {
        raffleDisplayImage.src = raffleInfo.raffleImage;
      }
    }

    raffleInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const raffleImageFile = document.getElementById('raffle-image').files[0];
      const raffleImageUrl = document.getElementById('raffle-image-url').value;

      const handleImageConfig = (imageData) => {
        const raffleInfo = {
          title: document.getElementById('raffle-title').value,
          date: document.getElementById('raffle-date').value,
          prizeAmount: document.getElementById('prize-amount').value,
          prizeDescription: document.getElementById('prize-description').value,
          ticketPrice: document.getElementById('ticket-price').value,
          raffleBasis: document.getElementById('raffle-basis').value,
          contactPhone: document.getElementById('contact-phone').value,
          contactWhatsapp: document.getElementById('contact-whatsapp').value,
          contactLocation: document.getElementById('contact-location').value,
          raffleImage: imageData,
          // Add logo configuration
          logoText: document.getElementById('logo-text').value,
          logoGradientStart: document.getElementById('logo-gradient-start').value,
          logoGradientEnd: document.getElementById('logo-gradient-end').value,
          sparkleColor: document.getElementById('sparkle-color').value
        };

        localStorage.setItem('raffleInfo', JSON.stringify(raffleInfo));
        this.updateRaffleInfo(raffleInfo);
        this.updateLogo(raffleInfo);
        alert('Información del sorteo guardada exitosamente');
      };

      if (raffleImageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleImageConfig(reader.result);
        };
        reader.readAsDataURL(raffleImageFile);
      } else if (raffleImageUrl) {
        handleImageConfig(raffleImageUrl);
      } else {
        handleImageConfig(document.getElementById('raffle-display-image').src);
      }
    });

    // Add real-time preview for logo changes
    ['logo-text', 'logo-gradient-start', 'logo-gradient-end', 'sparkle-color'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        const previewInfo = {
          logoText: document.getElementById('logo-text').value,
          logoGradientStart: document.getElementById('logo-gradient-start').value,
          logoGradientEnd: document.getElementById('logo-gradient-end').value,
          sparkleColor: document.getElementById('sparkle-color').value
        };
        this.updateLogo(previewInfo);
      });
    });

    // Load initial raffle info
    const initialRaffleInfo = localStorage.getItem('raffleInfo');
    if (initialRaffleInfo) {
      this.updateRaffleInfo(JSON.parse(initialRaffleInfo));
    }
  }

  updateLogo(config) {
    const logoGradient = document.querySelector('#logoGradient');
    if (logoGradient) {
      const stops = logoGradient.querySelectorAll('stop');
      stops[0].setAttribute('style', `stop-color:${config.logoGradientStart || '#1a237e'}`);
      stops[1].setAttribute('style', `stop-color:${config.logoGradientEnd || '#0d47a1'}`);
    }

    const logoText = document.querySelector('.company-logo text');
    if (logoText) {
      logoText.textContent = config.logoText || 'CHECHO';
    }

    const sparkles = document.querySelectorAll('.sparkles circle');
    sparkles.forEach(sparkle => {
      sparkle.setAttribute('fill', config.sparkleColor || '#ffd700');
    });
  }

  updateRaffleInfo(info) {
    const raffleBanner = document.querySelector('.raffle-banner');
    const prizeInfo = document.querySelector('.prize-info');
    const raffleRules = document.querySelector('.raffle-rules');
    const contactInfo = document.querySelector('.contact-info');
    const raffleDisplayImage = document.getElementById('raffle-display-image');

    if (raffleBanner) {
      raffleBanner.querySelector('h1').textContent = info.title;
      raffleBanner.querySelector('.raffle-date').textContent = `Fecha del Sorteo: ${new Date(info.date).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;
    }

    if (prizeInfo) {
      prizeInfo.querySelector('.prize-amount').textContent = `$${parseInt(info.prizeAmount).toLocaleString()}`;
      prizeInfo.querySelector('.prize-description').textContent = info.prizeDescription;
    }

    if (raffleRules) {
      const rulesList = raffleRules.querySelector('ul');
      rulesList.innerHTML = `
        <li>Precio por boleto: $${parseInt(info.ticketPrice).toLocaleString()}</li>
        <li>Sorteo con base en ${info.raffleBasis}</li>
        <li>El ganador será notificado vía telefónica</li>
        <li>Entrega del premio por transferencia bancaria</li>
      `;
    }

    if (contactInfo) {
      contactInfo.innerHTML = `
        <h3>Contacto</h3>
        <p>Para más información:</p>
        <p>Tel: ${info.contactPhone}</p>
        <p>WhatsApp: ${info.contactWhatsapp}</p>
        <p>Ubicación: ${info.contactLocation}</p>
      `;
    }

    if (raffleDisplayImage && info.raffleImage) {
      raffleDisplayImage.src = info.raffleImage;
    }
  }

  initAdminAccessModal() {
    const adminAccessModal = document.getElementById('admin-access-modal');
    const adminAccessForm = document.getElementById('admin-access-form');
    const closeAdminAccessModal = adminAccessModal.querySelector('.close-modal');
    const backButton = document.getElementById('admin-back-btn');

    const resetAdminAccessForm = () => {
      adminAccessForm.reset();
      document.getElementById('admin-username').value = '';
      document.getElementById('admin-password').value = '';
    };

    const closeAdminModal = () => {
      adminAccessModal.style.display = 'none';
      document.body.classList.remove('admin-modal-open');
      resetAdminAccessForm();
      this.showPage('home');
    };

    const preventModalClose = (e) => {
      if (e.target === adminAccessModal || e.target === closeAdminAccessModal) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add back button functionality
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      closeAdminModal();
    });

    const adminNavLink = document.querySelector('a[href="#admin"]');
    if (adminNavLink) {
      adminNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetAdminAccessForm();
        adminAccessModal.style.display = 'block';
        document.body.classList.add('admin-modal-open');
        
        adminAccessModal.addEventListener('click', preventModalClose);
        closeAdminAccessModal.addEventListener('click', preventModalClose);
      });
    }

    adminAccessForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username').value;
      const password = document.getElementById('admin-password').value;

      if (this.authManager.checkAdminAccess(username, password)) {
        adminAccessModal.removeEventListener('click', preventModalClose);
        closeAdminAccessModal.removeEventListener('click', preventModalClose);
        
        adminAccessModal.style.display = 'none';
        document.body.classList.remove('admin-modal-open');
        this.showPage('admin');
      } else {
        alert('Credenciales de administrador incorrectas. Acceso denegado.');
        resetAdminAccessForm();
        adminAccessModal.style.display = 'block';
        document.getElementById('admin-username').focus();
      }
    });

    closeAdminAccessModal.onclick = preventModalClose;
    adminAccessModal.onclick = preventModalClose;
  }

  displayFaqs() {
    const faqList = document.getElementById('faq-list');
    if (!faqList) return;
    
    faqList.innerHTML = '';
    const faqs = JSON.parse(localStorage.getItem('faqs')) || [];

    faqs.forEach((faq, index) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="faq-content">
          <h3>${faq.question}</h3>
          <p>${faq.answer}</p>
        </div>
        <div class="faq-actions">
          <button class="edit-faq-btn" data-index="${index}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Editar
          </button>
          <button class="delete-faq-btn" data-index="${index}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Eliminar
          </button>
        </div>
      `;
      faqList.appendChild(listItem);

      // Add edit handler
      const editBtn = listItem.querySelector('.edit-faq-btn');
      editBtn.addEventListener('click', () => this.showEditFaqModal(faq, index));

      // Add delete handler
      const deleteBtn = listItem.querySelector('.delete-faq-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm('¿Está seguro de que desea eliminar esta pregunta?')) {
          faqs.splice(index, 1);
          localStorage.setItem('faqs', JSON.stringify(faqs));
          this.displayFaqs();
          this.displayFaqsInHomePage();
        }
      });
    });
  }

  showEditFaqModal(faq, index) {
    // Create modal HTML
    const modalHTML = `
      <div id="edit-faq-modal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Editar Pregunta Frecuente</h2>
          <form id="edit-faq-form">
            <div class="form-group">
              <label for="edit-faq-question">Pregunta:</label>
              <input type="text" id="edit-faq-question" value="${faq.question}" required>
            </div>
            <div class="form-group">
              <label for="edit-faq-answer">Respuesta:</label>
              <textarea id="edit-faq-answer" rows="4" required>${faq.answer}</textarea>
            </div>
            <button type="submit" class="save-faq-btn">Guardar Cambios</button>
          </form>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('edit-faq-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('edit-faq-form');

    modal.style.display = 'block';

    // Handle close
    closeBtn.onclick = () => {
      modal.remove();
    };

    // Handle click outside
    window.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    // Handle form submit
    form.onsubmit = (e) => {
      e.preventDefault();
      
      const updatedFaq = {
        question: document.getElementById('edit-faq-question').value,
        answer: document.getElementById('edit-faq-answer').value
      };

      const idIndex = index;
      const faqs = JSON.parse(localStorage.getItem('faqs')) || [];
      faqs[idIndex] = updatedFaq;
      localStorage.setItem('faqs', JSON.stringify(faqs));

      this.displayFaqs();
      this.displayFaqsInHomePage();
      modal.remove();
      
      alert('Pregunta frecuente actualizada exitosamente');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Payment Modal Functionality
  const bankCardBtn = document.querySelector('.bank-card-btn');
  const paymentModal = document.getElementById('payment-modal');
  const paymentForm = document.getElementById('payment-form');
  const cardNumberInput = document.getElementById('card-number');
  const cardExpiryInput = document.getElementById('card-expiry');
  const cardHolder = document.getElementById('card-holder');
  const cardNumberDisplay = document.querySelector('.card-number-display');
  const cardHolderDisplay = document.querySelector('.card-holder');
  const cardExpiryDisplay = document.querySelector('.card-expiry');

  bankCardBtn.addEventListener('click', () => {
    paymentModal.style.display = 'block';
  });

  // Close payment modal
  paymentModal.querySelector('.close-modal').addEventListener('click', () => {
    paymentModal.style.display = 'none';
  });

  // Format card number with spaces
  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    e.target.value = formattedValue;
    cardNumberDisplay.textContent = formattedValue || '•••• •••• •••• ••••';
  });

  // Format expiry date
  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
    cardExpiryDisplay.textContent = value || 'MM/YY';
  });

  // Update card holder name
  cardHolder.addEventListener('input', (e) => {
    cardHolderDisplay.textContent = e.target.value.toUpperCase() || 'NOMBRE DEL TITULAR';
  });

  // Handle payment form submission
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Here you would typically handle the payment processing
    alert('¡Pago procesado exitosamente!');
    paymentModal.style.display = 'none';
    paymentForm.reset();
    cardNumberDisplay.textContent = '•••• •••• •••• ••••';
    cardHolderDisplay.textContent = 'NOMBRE DEL TITULAR';
    cardExpiryDisplay.textContent = 'MM/YY';
  });

  const pageManagerInstance = new PageManager();
  document.pageManagerInstance = pageManagerInstance;

  // Initialize FAQ toggling
  const faqItems = document.querySelectorAll('.faq-item h3');
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const faqItem = item.parentNode;
      faqItem.classList.toggle('active');
    });
  });

  // Call displayFaqs() to populate the FAQ list on load
  pageManagerInstance.displayFaqsInHomePage();
});