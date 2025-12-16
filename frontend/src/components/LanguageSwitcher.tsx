import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-white">
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-slate-200 focus:bg-slate-800 focus:text-cyan-400 cursor-pointer">
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('si')} className="text-slate-200 focus:bg-slate-800 focus:text-cyan-400 cursor-pointer text-base">
                    සිංහල (Sinhala)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
