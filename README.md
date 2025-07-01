# ?

## Development Guidelines

### Component Structure

File structure should mirror component hierarchy, with private/single-use components nested alongside their parent.

```
ParentComponent/
├── ParentComponent.tsx
└── PrivateChild.tsx
```

This prevents circular dependencies and makes the codebase self-documenting.
