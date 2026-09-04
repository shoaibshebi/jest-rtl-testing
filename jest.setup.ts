// Adds the DOM matchers: toBeInTheDocument, toHaveTextContent, toBeDisabled, ...
// https://github.com/testing-library/jest-dom
import { server } from '@/components/__fixtures__/server';
import '@testing-library/jest-dom';

beforeAll(()=> server.listen())
afterEach(()=>server.resetHandlers())
afterAll(()=>server.close())