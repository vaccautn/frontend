import { Navigate, useParams } from "react-router-dom";

export function RedirectAnimalDetail() {
  const { id } = useParams();
  return <Navigate to={`/rodeo/${id}`} replace />;
}
