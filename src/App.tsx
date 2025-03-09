import './App.css';
// import routes from './routes.json'
import { MantineProvider } from '@mantine/core';
import MainLayoutComponent from './shared/components/main_layout/MainLayout.component';
import '@mantine/core/styles.css';

function App() {
    return (
        <MantineProvider defaultColorScheme="dark">
            <MainLayoutComponent>
                {/* Your main content or routes go here */}
                <div>
                    <h1>Welcome to My App</h1>
                    {/* You can add your routes or other components here */}
                </div>
            </MainLayoutComponent>
        </MantineProvider>
    );
}

export default App;
