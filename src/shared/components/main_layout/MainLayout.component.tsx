import React, { ReactNode } from 'react';
import Navbar from '../nav_bar/NavBar.component';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayoutComponent: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
};

export default MainLayoutComponent;