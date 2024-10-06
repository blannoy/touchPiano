import axios from 'axios';
import { useState } from 'react';

const client = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL
});


export const defaultRequest = {
    url: '',
    method: '',
    headers: JSON.stringify({})
};

export function requestReducer(state, action) {
    var targetState = { ...state };
    switch (action.type) {
        case 'LOADCONFIG':
            targetState.url = '/config';
            targetState.method = 'get';
            targetState.params={};
            break;
            case 'WIFIMODE':
                targetState.url = '/wifiMode';
                targetState.method = 'get';
                targetState.params=action.params;                
                break;
        case 'SETCONFIG':
                targetState.url = '/setReg';
                targetState.method = action.method;
                if (action.method ==='post'){
                    targetState.data = action.body;
                }
                targetState.params=action.params;
                break;
        case 'MODE':
            targetState.url = '/pianoState';
            targetState.method = 'get';
            targetState.params = action.params;
            break;
            case 'AUTORELEASE':
                targetState.url = '/autoRelease';
                targetState.method = 'get';
                targetState.params = action.params;
                break;
                case 'AVERAGEPERIOD':
                    targetState.url = '/averagePeriod';
                    targetState.method = 'get';
                    targetState.params = action.params;
                    break;
        default:
            break;
    }
    return targetState;
}

export default function useRequest(request) {
    const [response, setResponse] = useState(null);
    const [error, setError] = useState({});

    const handleRequest = async (request) => {
        try {

            var data = await client.request(request);
            setError({});
            setResponse(data);

        } catch (error) {
            setError(error);
        }

    }

    return [response, error, (request) => handleRequest(request)];
}