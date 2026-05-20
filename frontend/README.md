# SGI Procurement Frontend

## Description
Frontend application for SGI Procurement System built with React.

## Technologies
- React 18.2.0
- React Router DOM 6.20.0
- Axios 1.6.2
- CSS3 (responsive design)
- Node.js / npm

## Project Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Navigation.js
│   │   └── ProductItem.js
│   ├── pages/               # Page components
│   │   ├── ProductList.js
│   │   ├── ProductForm.js
│   │   └── ProductDetail.js
│   ├── services/            # API services
│   ├── styles/              # CSS files
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Navigation.css
│   │   ├── ProductList.css
│   │   ├── ProductItem.css
│   │   ├── ProductForm.css
│   │   └── ProductDetail.css
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React context for state management
│   ├── utils/               # Utility functions
│   ├── App.js               # Main App component
│   └── index.js             # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 14.0 or higher
- npm 6.0 or higher

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Environment Configuration
- Backend API: `http://localhost:8080/api` (configured via proxy in package.json)
- Frontend Port: `3000`

## Available Scripts

### `npm start`
Runs the app in development mode. The page will reload on code changes.

### `npm build`
Builds the app for production. Output will be in the `build/` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Features

### Product Management
- **View Products**: Display all products in a grid layout with search functionality
- **Add Product**: Create new products with name, description, price, and quantity
- **Edit Product**: Update existing product information
- **Delete Product**: Remove products from the system
- **Product Details**: View complete product information with timestamps

## Pages

### ProductList
- Display all products
- Search functionality
- Edit and delete options
- Refresh button

### ProductForm
- Add new products
- Edit existing products
- Form validation
- Error handling

### ProductDetail
- View complete product details
- Show creation and update timestamps
- Quick access to edit functionality

## Components

### Navigation
- Top navigation bar
- Links to main sections
- Branding

### ProductItem
- Individual product card
- Display product info
- Action buttons (edit, delete)

## Styling
- Responsive design for mobile, tablet, and desktop
- CSS Grid and Flexbox layouts
- Hover effects and transitions
- Consistent color scheme

## API Integration
The frontend communicates with the backend API using:
- Fetch API for HTTP requests
- CORS enabled for cross-origin requests
- JSON data format

## Error Handling
- User-friendly error messages
- Loading states
- Validation feedback
- Network error handling

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Improvements
- Add state management (Redux/Context API)
- Implement user authentication
- Add advanced filtering and sorting
- Pagination for large datasets
- File upload functionality
- Real-time updates with WebSocket

## Development Tips
- Use React Developer Tools browser extension
- Check Network tab in DevTools for API calls
- Use console for debugging
- Test on different screen sizes

## License
Copyright © 2024 SGI Procurement
