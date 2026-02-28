export async function rpc(action: string, args: any[]) {
    const res = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, args }),
    });

    if (!res.ok) {
        throw new Error(`Server Error: ${res.statusText}`);
    }

    return res.json();
}

export const registerUser = (...args: any[]) => rpc('registerUser', args);
export const getFreelancers = (...args: any[]) => rpc('getFreelancers', args);
export const getUserById = (...args: any[]) => rpc('getUserById', args);
export const updateUser = (...args: any[]) => rpc('updateUser', args);
export const createOpportunity = (...args: any[]) => rpc('createOpportunity', args);
export const editOpportunity = (...args: any[]) => rpc('editOpportunity', args);
export const deleteOpportunity = (...args: any[]) => rpc('deleteOpportunity', args);
export const getOpportunities = (...args: any[]) => rpc('getOpportunities', args);
export const getOpportunityById = (...args: any[]) => rpc('getOpportunityById', args);
export const voteOpportunity = (...args: any[]) => rpc('voteOpportunity', args);
export const getUserVote = (...args: any[]) => rpc('getUserVote', args);
export const getActivePostCount = (...args: any[]) => rpc('getActivePostCount', args);
