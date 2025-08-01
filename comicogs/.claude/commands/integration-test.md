Run comprehensive integration testing for the Comicogs project.

Steps:

1. Start backend server: `cd backend && npm start`
2. Start frontend server: `cd frontend && PORT=3002 npm start`  
3. Start Next.js app: `cd comicogs-nextjs && npm run dev`
4. Run backend tests: `cd backend && npm run test:all`
5. Run frontend E2E tests: `cd frontend && npm run ui-test:comprehensive`
6. Run Next.js E2E tests: `cd comicogs-nextjs && npm run test:e2e`
7. Generate test report summary