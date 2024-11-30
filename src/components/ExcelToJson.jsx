import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { OrangeBtn, StyledLabel, HiddenInput,  } from './styles';

const ExcelToJson = () => {
    const [jsonData, setJsonData] = useState({});

    const generateUniqueId = () => {
        const randomNumbers = Math.floor(100000 + Math.random() * 900000).toString();
        const randomLetters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
        return `${randomLetters}${randomNumbers}`;
    };

    const formatJson = (rows, worksheet) => {
        const formatDate = (excelDate, format) => {
            try {
                if (!excelDate) return null;
    
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                if (isNaN(jsDate.getTime())) {
                    return excelDate; // Повертаємо вихідне значення, якщо дата не валідна
                }
    
                const dd = String(jsDate.getDate()).padStart(2, '0');
                const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
                const yyyy = jsDate.getFullYear();
    
                return format === 'dd.mm.yyyy'
                    ? `${dd}.${mm}.${yyyy}`
                    : `${yyyy}-${mm}-${dd}`;
            } catch (error) {
                return excelDate; // Повертаємо вихідне значення у разі помилки
            }
        };
    
        const processPhones = (phones) => {
            const formattedPhones = phones.filter((phone) => phone !== null).map((phone) => {
                if (phone.startsWith('(0')) {
                    return `38${phone.replace(/[()]/g, '')}`;
                }
                return phone;
            });
            return formattedPhones.length > 1 ? formattedPhones : formattedPhones[0] ? formattedPhones[0] : null;
        };
    
        const processLinks = (link1, link2, link3) => {
            const links = [link1, link2, link3].filter((l) => l !== null);
            return links.length > 1 ? { otherLink: links } : links[0] ? { otherLink: links[0] } : null;
        };
    
        const processComments = (comment1, comment2, comment3, notes) => {
            const comments = [comment1, comment2, comment3].filter((c) => c !== null).map((comment, index) => {
                if (index === 2) {
                    return formatDate(comment, 'dd.mm.yyyy');
                }
                return comment;
            });
            if (notes) {
                comments.push(notes); // Додаємо примітки до коментарів
            }
            return comments.length ? { myComment: comments.join('; ') } : null;
        };
    
        return rows.reduce((acc, row, rowIndex) => {
            const {
                phone1,
                phone2,
                phone3,
                otherLink1,
                otherLink2,
                otherLink3,
                myComment1,
                myComment2,
                myComment3,
                birth,
                lastAction,
                getInTouch,
                Вік,
                ІМТ,
                csection,
                ...rest
            } = row;
    
            const uniqueId = generateUniqueId();
    
        // Отримуємо примітки для цього рядка
        const notes = [];
        Object.keys(row).forEach((key, colIndex) => {
            // Вираховуємо правильний номер рядка
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
            const cell = worksheet[cellAddress];
            if (cell && cell.c) {
                notes.push(...cell.c.map((comment) => comment.t));
            }
        });
    
        acc[uniqueId] = {
            ...Object.fromEntries(
                Object.entries(rest).filter(([key, value]) => value !== null)
            ),
            ...(processPhones([phone1, phone2, phone3]) ? { phone: processPhones([phone1, phone2, phone3]) } : {}),
            ...(processLinks(otherLink1, otherLink2, otherLink3) || {}),
            ...(processComments(myComment1, myComment2, myComment3, notes.join('; ')) || {}),
            ...(birth ? { birth: formatDate(birth, 'dd.mm.yyyy') } : {}),
            ...(lastAction ? { lastAction: formatDate(lastAction, 'dd.mm.yyyy') } : {}),
            ...(getInTouch ? { getInTouch: formatDate(getInTouch, 'yyyy-mm-dd') } : {}),
            ...(csection ? { csection: formatDate(csection, 'dd.mm.yyyy') } : {}),
        };
    
            return acc;
        }, {});
    };
    

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
    
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
                const formattedData = formatJson(rows, worksheet);
                setJsonData(formattedData);
            };
            reader.readAsArrayBuffer(file);
        }
    };
    

    const downloadJson = () => {
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'structured_data.json';
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div>
        <StyledLabel>
        <HiddenInput type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        Up
      </StyledLabel>
        <OrangeBtn onClick={downloadJson} disabled={Object.keys(jsonData).length === 0}>
          ↓ {/* Іконка для завантаження JSON */}
        </OrangeBtn>
        {Object.keys(jsonData).length > 0 && (
          <pre style={{ color: 'black' }}>{JSON.stringify(jsonData, null, 2)}</pre>
        )}
      </div>
    );
};

export default ExcelToJson;
