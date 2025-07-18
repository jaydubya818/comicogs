# Task 3: Add/Edit/Delete Comics from Collection

## Feature
Add/edit/delete comics from collection

## Description
Allow users to manage their personal comic book collections by adding, editing, and deleting comic entries.

## Requirements
- A `collections` table linking users and comics, with fields for condition, purchase price, notes, and acquired date.
- API endpoints for adding, editing, and deleting comic entries in a user's collection.
- Frontend forms and UI elements for managing collection entries.

## Implementation Steps
1.  **Backend:**
    -   Create the `collections` table in the PostgreSQL database.
    -   Implement API endpoints for:
        -   `POST /api/collections`: Add a comic to a user's collection.
        -   `PUT /api/collections/:id`: Edit an existing comic entry in a user's collection.
        -   `DELETE /api/collections/:id`: Delete a comic entry from a user's collection.
2.  **Frontend:**
    -   Create a form for adding new comics to the collection.
    -   Create an interface for viewing and editing existing collection entries.
    -   Implement functionality to delete comics from the collection.
